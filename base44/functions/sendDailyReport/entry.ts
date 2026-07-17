import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      return Response.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { date_from, date_to, recipient_email } = await req.json();
    const email = recipient_email || user.email;

    // Get sales for the date range
    const allSales = await base44.asServiceRole.entities.Sale.list('-created_date', 1000);
    
    const from = new Date(date_from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date_to);
    to.setHours(23, 59, 59, 999);

    const filteredSales = allSales.filter(s => {
      const saleDate = new Date(s.created_date);
      return saleDate >= from && saleDate <= to && s.status === 'completada';
    });

    const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalTransactions = filteredSales.length;
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Sales by waiter
    const waiterMap = {};
    filteredSales.forEach(s => {
      const name = s.waiter_name || 'Sin mesero';
      waiterMap[name] = (waiterMap[name] || 0) + (s.total || 0);
    });

    // Sales by cashier
    const cashierMap = {};
    filteredSales.forEach(s => {
      const name = s.cashier_name || 'Sin cajero';
      cashierMap[name] = (cashierMap[name] || 0) + (s.total || 0);
    });

    // Sales by payment method
    const paymentMap = {};
    filteredSales.forEach(s => {
      const method = s.payment_method || 'Otro';
      paymentMap[method] = (paymentMap[method] || 0) + (s.total || 0);
    });

    const reportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4338ca;">Reporte de Ventas</h2>
        <p style="color: #666;">Período: ${date_from} al ${date_to}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top:0;">Resumen</h3>
          <p><strong>Total de Ventas:</strong> $${totalSales.toFixed(2)}</p>
          <p><strong>Transacciones:</strong> ${totalTransactions}</p>
          <p><strong>Ticket Promedio:</strong> $${avgTicket.toFixed(2)}</p>
        </div>

        <h3>Ventas por Método de Pago</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr style="background: #4338ca; color: white;">
            <th style="padding: 8px; text-align: left;">Método</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
          ${Object.entries(paymentMap).map(([method, total]) => 
            `<tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${method}</td>
              <td style="padding: 8px; text-align: right;">$${total.toFixed(2)}</td>
            </tr>`
          ).join('')}
        </table>

        <h3>Ventas por Mesero</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr style="background: #4338ca; color: white;">
            <th style="padding: 8px; text-align: left;">Mesero</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
          ${Object.entries(waiterMap).map(([name, total]) => 
            `<tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${name}</td>
              <td style="padding: 8px; text-align: right;">$${total.toFixed(2)}</td>
            </tr>`
          ).join('')}
        </table>

        <h3>Ventas por Cajero</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr style="background: #4338ca; color: white;">
            <th style="padding: 8px; text-align: left;">Cajero</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
          ${Object.entries(cashierMap).map(([name, total]) => 
            `<tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${name}</td>
              <td style="padding: 8px; text-align: right;">$${total.toFixed(2)}</td>
            </tr>`
          ).join('')}
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          Reporte generado automáticamente por el Sistema POS
        </p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `Reporte de Ventas - ${date_from} al ${date_to}`,
      body: reportHtml,
    });

    return Response.json({ success: true, message: `Reporte enviado a ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});