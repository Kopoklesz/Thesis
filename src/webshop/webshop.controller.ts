import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseFilters,
  UseGuards,
  Request,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { WebshopService } from './webshop.service';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { CreateWebshopDto } from '../dto/create-webshop.dto';
import { UpdateWebshopDto } from '../dto/update-webshop.dto';
import { AddPartnerDto } from '../dto/manage-webshop-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entity/user.entity';

@Controller('webshop')
@UseFilters(new HttpExceptionFilter())
export class WebshopController {
  constructor(private readonly webshopService: WebshopService) { }

  @Get()
  async getAllWebshops() {
    try {
      return await this.webshopService.getAllWebshops();
    } catch (error) {
      throw new HttpException('Failed to fetch webshops', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-webshops')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getMyWebshops(@Request() req) {
    try {
      const teacherId = req.user?.sub || req.user?.userId || req.user?.user_id || req.user?.id;
      const userRole = req.user?.role;

      console.log('🔍 Getting my webshops for teacher:', teacherId, 'role:', userRole);

      if (!teacherId) {
        throw new HttpException('Teacher ID not found in JWT token', HttpStatus.BAD_REQUEST);
      }

      if (userRole === UserRole.ADMIN) {
        return await this.webshopService.getAllWebshops();
      }

      return await this.webshopService.getWebshopsForTeacher(teacherId);
    } catch (error) {
      console.error('❌ Error fetching my webshops:', error);
      throw new HttpException('Failed to fetch teacher webshops', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async createWebshop(
    @Request() req,
    @Body() createWebshopDto: CreateWebshopDto
  ) {
    try {
      console.log('=== CREATE WEBSHOP REQUEST ===');
      console.log('Full req.user object:', req.user);
      console.log('req.user.sub:', req.user?.sub);
      console.log('req.user.userId:', req.user?.userId);
      console.log('req.user.user_id:', req.user?.user_id);
      console.log('req.user.id:', req.user?.id);

      const teacherId = req.user?.sub || req.user?.userId || req.user?.user_id || req.user?.id;
      const userRole = req.user?.role;

      console.log('Extracted teacher ID:', teacherId);
      console.log('Teacher ID type:', typeof teacherId);
      console.log('User role:', userRole);
      console.log('Webshop data:', createWebshopDto);
      console.log('=============================');

      if (!teacherId) {
        throw new HttpException(
          'Teacher ID nem található a JWT token-ben!',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.webshopService.createWebshop(teacherId, createWebshopDto);
    } catch (error) {
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.FORBIDDEN) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException('Failed to create webshop', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getWebshop(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.webshopService.getWebshop(id);
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch webshop', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/categories')
  async getCategories(@Param('id', ParseIntPipe) webshopId: number) {
    try {
      return await this.webshopService.getCategories(webshopId);
    } catch (error) {
      throw new HttpException('Failed to fetch categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async updateWebshop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWebshopDto: UpdateWebshopDto
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      return await this.webshopService.updateWebshop(userId, userRole, id, updateWebshopDto);
    } catch (error) {
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.FORBIDDEN) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException('Failed to update webshop', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async deleteWebshop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      return await this.webshopService.deleteWebshop(userId, userRole, id);
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Failed to delete webshop', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/partners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async addPartner(
    @Request() req,
    @Param('id', ParseIntPipe) webshopId: number,
    @Body() addPartnerDto: AddPartnerDto
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      return await this.webshopService.addPartnerToWebshop(
        webshopId,
        addPartnerDto.partner_teacher_id,
        userId,
        userRole
      );
    } catch (error) {
      if (error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.FORBIDDEN ||
        error.status === HttpStatus.NOT_FOUND) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException('Failed to add partner', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id/partners/:partnerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async removePartner(
    @Request() req,
    @Param('id', ParseIntPipe) webshopId: number,
    @Param('partnerId', ParseIntPipe) partnerId: number
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      return await this.webshopService.removePartnerFromWebshop(
        webshopId,
        partnerId,
        userId,
        userRole
      );
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN || error.status === HttpStatus.NOT_FOUND) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException('Failed to remove partner', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/partners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getPartners(
    @Request() req,
    @Param('id', ParseIntPipe) webshopId: number
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      return await this.webshopService.getWebshopPartners(webshopId, userId, userRole);
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Failed to fetch partners', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}