import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ImageService {
  private containerClient?: ContainerClient;
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get connectionString(): string {
    const value = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    if (!value) {
      throw new InternalServerErrorException(
        'Configuração AZURE_STORAGE_CONNECTION_STRING ausente',
      );
    }
    return value;
  }

  private get containerName(): string {
    return this.configService.get<string>('AZURE_STORAGE_CONTAINER') ?? 'images';
  }

  private async ensureContainer(): Promise<ContainerClient> {
    if (this.containerClient) {
      return this.containerClient;
    }

    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        this.connectionString,
      );
      const containerClient = blobServiceClient.getContainerClient(
        this.containerName,
      );

      if (!(await containerClient.exists())) {
        await containerClient.create({ access: 'blob' });
      }

      this.containerClient = containerClient;
      return containerClient;
    } catch (error) {
      this.logger.error('Erro ao inicializar o container do Blob Storage', error);
      throw new InternalServerErrorException(
        'Falha ao conectar no Azure Blob Storage',
      );
    }
  }

  async upload(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo enviado não é uma imagem válida');
    }

    const containerClient = await this.ensureContainer();
    const extension = extname(file.originalname);
    const blobName = `${randomUUID()}${extension}`;

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const created = await this.prisma.image.create({
        data: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          blobName,
          url: blockBlobClient.url,
        },
      });

      return created;
    } catch (error) {
      this.logger.error('Erro ao fazer upload de imagem', error);
      throw new InternalServerErrorException(
        'Não foi possível salvar a imagem. Tente novamente mais tarde.',
      );
    }
  }

  async findById(id: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }
    return image;
  }

  async delete(id: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    const containerClient = await this.ensureContainer();
    const blobClient = containerClient.getBlockBlobClient(image.blobName);

    try {
      await blobClient.deleteIfExists();
    } catch (error) {
      this.logger.error('Erro ao remover blob da imagem', error);
      // Prossegue para remover o registro para evitar órfãos
    }

    await this.prisma.image.delete({ where: { id } });
    return { success: true };
  }
}

