---
name: Recovery plan safety boundary
description: Durable contract for AI-assisted recovery education drafts
---

The recovery-plan model is a selector, not a prescriber: it may return only approved exercise slugs and focus domains. The server must resolve those slugs against catalog records with explicit safety notes and construct all persisted copy and fields.

**Why:** Free-form model output previously controlled exercise dosage, progression, nutrition targets, weekly prescriptions, and safety text. Those values must not reach a survivor or storage by way of an AI response.

**How to apply:** Keep the persisted plan schema strict and education-focused. Reject unknown model fields, invented slugs, catalog entries without safety notes, and legacy prescription-shaped stored plans before returning or saving them. Any intensity, dosage, medication, or nutrition change needs explicit user and clinician context outside the model selector.