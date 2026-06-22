import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'finance_manager')
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}
  @Get('revenue/summary') revenueSummary(@Query() q: ReportFilterDto) { return this.svc.getRevenueSummary(q); }
  @Get('revenue/by-period') revenueByPeriod(@Query() q: ReportFilterDto) { return this.svc.getRevenueByPeriod(q); }
  @Get('orders/by-status') ordersByStatus(@Query() q: ReportFilterDto) { return this.svc.getOrdersByStatus(q); }
  @Get('products/top') topProducts(@Query() q: ReportFilterDto) { return this.svc.getTopProducts(q); }
  @Get('customers/stats') customerStats(@Query() q: ReportFilterDto) { return this.svc.getCustomerStats(q); }
  @Get('inventory/low-stock') lowStock() { return this.svc.getLowStockProducts(); }
}
