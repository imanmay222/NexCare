package util

import (
	"bytes"
	"strings"
	"testing"
	"time"

	model "nexcare/backend/models"
)

func TestGeneratePrescriptionPDF(t *testing.T) {
	status := "Finalized"
	age := int64(42)
	pdfBytes, err := GeneratePrescriptionPDF(PrescriptionPDFData{
		Prescription: model.Prescription{
			A_id:      "appointment-id",
			Title:     "Prescription",
			Diagnosis: "Seasonal allergy",
			Drug: []model.Medicine{
				{Name: "Medicine One", Dosage: "10", DosageUnit: "mg", Frequency: "Once daily", Duration: "5", DurationUnit: "days"},
				{Name: "Medicine Two", Dosage: "1", DosageUnit: "tablet", Frequency: "Twice daily", Duration: "3", DurationUnit: "days"},
				{Name: "Medicine Three", Dosage: "5", DosageUnit: "mg", Frequency: "As needed", Duration: "2", DurationUnit: "days"},
			},
			Summary: strings.Repeat("Long prescription summary. ", 300),
			Status:  &status,
		},
		CreatedAt:     time.Date(2026, time.October, 3, 0, 0, 0, 0, time.UTC),
		DoctorName:    "Dr. NexCare",
		PatientName:   "Patient",
		PatientAge:    &age,
		PatientGender: "Unknown",
		PatientID:     "patient-id",
	})
	if err != nil {
		t.Fatalf("GeneratePrescriptionPDF() error = %v", err)
	}
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Fatal("GeneratePrescriptionPDF() did not return a PDF document")
	}
}
