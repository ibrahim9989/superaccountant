import { z } from 'zod'

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  country: z.string().min(2, 'Country is required'),
  education: z.string().min(1, 'Education level is required'),
  workExperience: z.string().min(1, 'Work experience is required'),
  currentOccupation: z.string().min(2, 'Current occupation is required'),
  accountingExperience: z.string().min(1, 'Accounting experience is required'),
  motivation: z.string().min(50, 'Please provide at least 50 characters explaining your motivation'),
  goals: z.string().min(50, 'Please provide at least 50 characters explaining your goals'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone must be at least 10 digits'),
  emergencyContactRelation: z.string().min(2, 'Emergency contact relation is required'),
})

export type ProfileFormData = z.infer<typeof profileSchema>



