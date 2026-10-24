package model

import (
	"time"
)

type Appointment struct {
    Id             string `json:"id"`
    D_id           string `json:"d_id"`
    DoctorName     string `json:"doctorName"`
    Date           string `json:"date"`
    Time           string `json:"time"`
    Type           string `json:"type"`
    Status         string `json:"status"`
    Symptoms       string `json:"symptoms"`
	PaymentId      string `json:"paymentId"`
}

type BloodPressure struct {
	Sys int64 ` json:"sys" `
	Dia int64 ` json:"dia" `
}

type Health_Metrics struct {
	Id         string        ` json:"id" binding:"required"`
	Bp         BloodPressure ` json:"bp"  binding:"required" `
	Temp       float64       ` json:"temp"  binding:"required" `
	Heart_Rate int64         ` json:"heart_rate"  binding:"required" `
	Weight     float64       ` json:"weight"  binding:"required" `
	Height     float64       ` json:"height"  binding:"required" `
	Created_At time.Time     ` json:"created_at" `
	Spo2       int64         ` json:"spo2"  binding:"required" `
}

type Contacts struct {
	Name     string ` json:"name" `
	Phn_no   string `json:"phn_no" `
	Relation string ` json:"relation" `
}

type Menstrual struct {
	Flow                string ` json:"flow" `
	Amount              string ` json:"amount" `
	Duration            string ` json:"duration" `
	Menarche            string ` json:"menarche" `
	Regularity          string ` json:"regularity" `
	Cycle_Length        string ` json:"cycle_length" `
	Associated_Symptoms string ` json:"associated_symptoms" `
}

type HealthSummary struct {
	Id                 string     ` json:"id" binding:"required" `
	Created_At         time.Time  `json:"created_at"`
	Blood_Type         string     ` json:"blood_type" binding:"required" `
	Allergies          string     ` json:"allergies" binding:"required" `
	Insurance          string     ` json:"insurance" binding:"required" `
	Contact            []Contacts ` json:"contacts" binding:"required" `
	Family_History     string     ` json:"family_history" `
	Surgical_History   string     ` json:"surgical_history" `
	Current_Medication string     ` json:"current_medications" `
	Medical_Conditions string     ` json:"medical_conditions" `
	Menstrual_History  Menstrual  ` json:"menstrual_history" `
	Lmp                time.Time  ` json:"lmp" `
}

type Consultation struct {
	Id                   string     `json:"id"`
	A_id                 string     `json:"a_id"`
	Created_At           time.Time  `json:"created_at"`
	Title                string     `json:"title"`
	Symptoms             string     `json:"symptoms"`
	Diagnosis            string     `json:"diagnosis"`
	Treatment            string     `json:"treatment"`
	Physical_examination string     `json:"physical_examination"`
	Drug                 []Medicine `json:"drug"`
	Investigations       string     `json:"investigations"`
	Summary              *string    `json:"summary"`
	Name                 string     `json:"name"`
	Follow_Up_Date       *time.Time `json:"follow_up_date"`
	Status               *string    `json:"status"`
	Finalized_At         *time.Time `json:"finalized_at"`
	Patient_Name         string     `json:"patient_name"`
	Patient_Age          *int64     `json:"patient_age"`
	Patient_Gender       string     `json:"patient_gender"`
	Patient_ID           string     `json:"patient_id"`
}

type TestValues struct {
	Value    float64 ` json:"value" binding:"required" `
	Minvalue float64 ` json:"min_value" `
	Maxvalue float64 ` json:"max_value" `
	Unit     string  ` json:"unit" `
}

type LabResult struct {
	Id         string                ` json:"id" binding:"required" `
	P_id       string                ` json:"p_id" binding:"required" `
	D_id       string                ` json:"d_id" binding:"required" `
	Test_group string                ` json:"test_group" binding:"required" `
	Results    map[string]TestValues ` json:"results"  binding:"required" `
	Created_At time.Time             ` json:"created_at" `
	Name       string                ` json:"name" `
	Summary    *string               ` json:"summary" `
}

type SymptomResult struct {
	Assessment     string  ` json:"assessment" `
	Urgency        string  ` json:"urgency" `
	Recommendation []string  ` json:"recommendation" `
	Confidence     float64 ` json:"confidence" `
	Next_steps     []string  ` json:"nextSteps" `
	Should_Consult bool    ` json:"shouldConsult" `
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}