import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.id;
    const orderId = id;

    // Get order with all details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customerId,
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                brand: true,
                retailPrice: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Set response headers
    const response = new NextResponse(
      new ReadableStream({
        start(controller) {
          doc.pipe({
            write(chunk: Uint8Array) {
              controller.enqueue(chunk);
            },
            end() {
              controller.close();
            },
          });
        },
      }),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="order-${orderId.slice(-8)}.pdf"`,
        },
      },
    );

    // Generate PDF content
    generateInvoicePDF(doc, order);

    doc.end();
    return response;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateInvoicePDF(doc: Record<string, unknown>, order: Record<string, unknown>) {
  const { customer, orderItems, createdAt, status } = order;

  // Header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Project X - Factuur", { align: "center" })
    .moveDown();

  // Company info
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Project X B.V.", { align: "left" })
    .text("Voorbeeldstraat 123")
    .text("1000 AA Amsterdam")
    .text("Nederland")
    .text("BTW: NL123456789B01")
    .moveDown();

  // Invoice details
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`Factuur: #${order.id.slice(-8)}`)
    .fontSize(12)
    .font("Helvetica")
    .text(`Datum: ${new Date(createdAt).toLocaleDateString("nl-NL")}`)
    .text(`Status: ${getStatusText(status)}`)
    .moveDown();

  // Customer info
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Klantgegevens:")
    .fontSize(12)
    .font("Helvetica")
    .text(customer.name)
    .text(customer.email)
    .text(customer.phone || "")
    .text(customer.address || "")
    .moveDown();

  // Items table
  doc.fontSize(14).font("Helvetica-Bold").text("Bestelde Producten:").moveDown();

  // Table headers
  const tableTop = doc.y;
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 350;
  const priceX = 400;
  const totalX = 500;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Product", itemCodeX, tableTop)
    .text("Merk", descriptionX, tableTop)
    .text("Aantal", quantityX, tableTop)
    .text("Prijs", priceX, tableTop)
    .text("Totaal", totalX, tableTop);

  // Table content
  let currentY = tableTop + 20;
  let subtotal = 0;

  orderItems.forEach((item: Record<string, unknown>) => {
    const itemTotal = item.quantity * Number(item.price);
    subtotal += itemTotal;

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(item.product.name, itemCodeX, currentY)
      .text(item.product.brand, descriptionX, currentY)
      .text(item.quantity.toString(), quantityX, currentY)
      .text(formatPrice(Number(item.price)), priceX, currentY)
      .text(formatPrice(itemTotal), totalX, currentY);

    currentY += 20;
  });

  // Totals
  const vatRate = 0.21; // 21% BTW
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  doc
    .moveDown()
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(`Subtotaal: ${formatPrice(subtotal)}`, { align: "right" })
    .text(`BTW (21%): ${formatPrice(vatAmount)}`, { align: "right" })
    .text(`Totaal: ${formatPrice(total)}`, { align: "right" })
    .moveDown();

  // Footer
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Bedankt voor uw bestelling!", { align: "center" })
    .text("Voor vragen neem contact op via info@projectx.nl", { align: "center" });
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    PENDING: "In afwachting",
    APPROVED: "Goedgekeurd",
    REJECTED: "Afgewezen",
    CANCELLED: "Geannuleerd",
  };
  return statusMap[status] || status;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
