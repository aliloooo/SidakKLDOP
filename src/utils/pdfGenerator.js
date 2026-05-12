import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from an HTML element
 * @param {string} elementId - The ID of the HTML element to capture
 * @param {string} filename - The name of the resulting PDF file
 */
export async function generatePDF(elementId, filename = 'report.pdf') {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }

    try {
        // Create canvas from HTML element
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true, // Crucial for loading images from external URLs
            logging: false,
            allowTaint: true,
            onclone: (clonedDoc) => {
                // Show elements that are marked for PDF only
                const pdfOnlyElements = clonedDoc.querySelectorAll('.pdf-only');
                pdfOnlyElements.forEach(el => {
                    el.style.display = 'block';
                });
            }
        });

        const imgData = canvas.toDataURL('image/png');
        
        // PDF setup (A4 size)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If content is longer than one page
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
