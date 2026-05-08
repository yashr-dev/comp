import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(elementId, clientName) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("PDF element not found");
    return;
  }
  
  // Show a loading state on the button if needed (handled externally usually)
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f0f14',
      logging: false,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    let heightLeft = pdfHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    pdf.save(`${clientName.replace(/\s+/g, '_')}_Audit_${now.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}
