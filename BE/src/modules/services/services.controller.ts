import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../../common/decorators/get-admin.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /** Admin: get all services (including inactive) */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryServiceDto, @GetAdmin() admin: any) {
    return this.servicesService.findAll(query, admin.id);
  }

  /** Public: get active services only (for customer menu) */
  @Get('public')
  findAllActive(@Query() query: QueryServiceDto) {
    return this.servicesService.findAllActive(query, query.adminId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateServiceDto, @GetAdmin() admin: any) {
    return this.servicesService.create(dto, admin.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @GetAdmin() admin: any,
  ) {
    return this.servicesService.update(id, dto, admin.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @GetAdmin() admin: any) {
    return this.servicesService.remove(id, admin.id);
  }
}
