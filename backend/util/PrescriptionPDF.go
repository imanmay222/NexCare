package util

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	model "nexcare/backend/models"
)

type PrescriptionPDFData struct {
	Prescription  model.Prescription
	CreatedAt     time.Time
	DoctorName    string
	PatientName   string
	PatientAge    *int64
	PatientGender string
	PatientID     string
}

func GeneratePrescriptionPDF(data PrescriptionPDFData) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(16, 18, 16)
	pdf.SetAutoPageBreak(true, 18)
	translate := pdf.UnicodeTranslatorFromDescriptor("")

	pdf.SetHeaderFunc(func() {
		pdf.SetFont("Arial", "B", 17)
		pdf.SetTextColor(15, 69, 110)
		pdf.CellFormat(0, 9, "NexCare", "", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 9)
		pdf.SetTextColor(80, 95, 110)
		pdf.CellFormat(0, 5, "DIGITAL PRESCRIPTION", "", 1, "L", false, 0, "")
		pdf.Ln(3)
		pdf.SetDrawColor(190, 205, 218)
		pdf.Line(16, pdf.GetY(), 194, pdf.GetY())
		pdf.Ln(5)
	})
	pdf.SetFooterFunc(func() {
		pdf.SetY(-13)
		pdf.SetFont("Arial", "", 8)
		pdf.SetTextColor(110, 120, 130)
		pdf.CellFormat(0, 5, fmt.Sprintf("NexCare  |  Page %d", pdf.PageNo()), "", 0, "R", false, 0, "")
	})
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 15)
	pdf.SetTextColor(25, 45, 65)
	pdf.MultiCell(0, 7, translate(pdfText(data.Prescription.Title, "Prescription")), "", "L", false)
	pdf.Ln(2)

	addPDFSection(pdf, translate, "Patient Information")
	age := "Not specified"
	if data.PatientAge != nil {
		age = fmt.Sprintf("%d", *data.PatientAge)
	}
	addPDFField(pdf, translate, "Name", data.PatientName)
	addPDFField(pdf, translate, "Age", age)
	addPDFField(pdf, translate, "Gender", data.PatientGender)
	addPDFField(pdf, translate, "Patient ID", data.PatientID)

	addPDFSection(pdf, translate, "Prescription Details")
	addPDFField(pdf, translate, "Appointment ID", data.Prescription.A_id)
	addPDFField(pdf, translate, "Date", formatPDFDate(&data.CreatedAt))
	addPDFField(pdf, translate, "Doctor", data.DoctorName)
	addPDFField(pdf, translate, "Diagnosis", data.Prescription.Diagnosis)
	addPDFField(pdf, translate, "Symptoms", data.Prescription.Symptoms)

	addPDFSection(pdf, translate, "Clinical Information")
	addPDFField(pdf, translate, "Physical Examination", data.Prescription.Physical_Examination)
	addPDFField(pdf, translate, "Treatment / General Instructions", data.Prescription.Treatment)
	addPDFField(pdf, translate, "Investigations", data.Prescription.Investigation)

	addPDFSection(pdf, translate, "Medicines")
	if len(data.Prescription.Drug) == 0 {
		addPDFField(pdf, translate, "Medicines", "None recorded")
	}
	for index, medicine := range data.Prescription.Drug {
		ensurePDFSpace(pdf, 18)
		pdf.SetFont("Arial", "B", 10)
		pdf.SetTextColor(25, 45, 65)
		pdf.MultiCell(0, 5, translate(fmt.Sprintf("%d. %s", index+1, pdfText(medicine.Name, "Medicine"))), "", "L", false)
		pdf.SetFont("Arial", "", 9)
		pdf.SetTextColor(55, 65, 75)
		medicineDetails := []string{
			pdfFieldText("Form", medicine.Form),
			pdfFieldText("Dosage", strings.TrimSpace(medicine.Dosage+" "+medicine.DosageUnit)),
			pdfFieldText("Route", medicine.Route),
			pdfFieldText("Frequency", medicine.Frequency),
			pdfFieldText("Duration", strings.TrimSpace(medicine.Duration+" "+medicine.DurationUnit)),
			pdfFieldText("Food Instructions", medicine.FoodInstructions),
			pdfFieldText("Instructions", medicine.Instructions),
		}
		pdf.MultiCell(0, 4.5, translate(strings.Join(medicineDetails, "\n")), "", "L", false)
		pdf.Ln(2)
	}

	addPDFSection(pdf, translate, "Summary")
	addPDFField(pdf, translate, "Summary", data.Prescription.Summary)

	addPDFSection(pdf, translate, "Follow Up")
	addPDFField(pdf, translate, "Follow-up Date", formatPDFDate(data.Prescription.Follow_Up_Date))
	status := ""
	if data.Prescription.Status != nil {
		status = *data.Prescription.Status
	}
	addPDFField(pdf, translate, "Status", status)
	addPDFField(pdf, translate, "Finalized At", formatPDFDate(data.Prescription.Finalized_At))

	ensurePDFSpace(pdf, 18)
	pdf.Ln(10)
	pdf.SetDrawColor(90, 105, 120)
	pdf.Line(16, pdf.GetY(), 85, pdf.GetY())
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(90, 105, 120)
	pdf.CellFormat(69, 5, translate("Doctor signature"), "", 1, "C", false, 0, "")

	var output bytes.Buffer
	if err := pdf.Output(&output); err != nil {
		return nil, err
	}
	return output.Bytes(), nil
}

func addPDFSection(pdf *fpdf.Fpdf, translate func(string) string, title string) {
	ensurePDFSpace(pdf, 13)
	pdf.Ln(2)
	pdf.SetFont("Arial", "B", 11)
	pdf.SetTextColor(15, 69, 110)
	pdf.CellFormat(0, 7, translate(title), "", 1, "L", false, 0, "")
	pdf.SetDrawColor(215, 225, 233)
	pdf.Line(16, pdf.GetY(), 194, pdf.GetY())
	pdf.Ln(2)
}

func addPDFField(pdf *fpdf.Fpdf, translate func(string) string, label, value string) {
	if strings.TrimSpace(value) == "" {
		value = "Not specified"
	}
	ensurePDFSpace(pdf, 10)
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(50, 65, 80)
	pdf.Write(4.5, translate(label+": "))
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(35, 45, 55)
	pdf.MultiCell(0, 4.5, translate(pdfText(value, "Not specified")), "", "L", false)
}

func ensurePDFSpace(pdf *fpdf.Fpdf, requiredHeight float64) {
	if pdf.GetY()+requiredHeight > 279 {
		pdf.AddPage()
	}
}

func pdfText(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}

func pdfFieldText(label, value string) string {
	if strings.TrimSpace(value) == "" {
		value = "Not specified"
	}
	return label + ": " + value
}

func formatPDFDate(value *time.Time) string {
	if value == nil || value.IsZero() {
		return "Not specified"
	}
	return value.Local().Format("02 January 2006")
}
