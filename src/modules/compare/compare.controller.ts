import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompareService } from './compare.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Compare')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compare')
export class CompareController {
  constructor(private readonly svc: CompareService) {}
  @Get() getList(@CurrentUser() user: { id: string }) { return this.svc.getOrCreate(user.id); }
  @Post(':productId') addProduct(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) pid: string) { return this.svc.addProduct(user.id, pid); }
  @Delete(':productId') removeProduct(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) pid: string) { return this.svc.removeProduct(user.id, pid); }
  @Delete() clearList(@CurrentUser() user: { id: string }) { return this.svc.clearList(user.id); }
}
