import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { emailService } from '../services/emailService';

export const contactRouter = Router();

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required')
});

// POST /api/contact - Submit contact form
contactRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = contactFormSchema.parse(req.body);

    // Send email notification asynchronously
    const emailSent = await emailService.sendContactFormNotification({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message
    });

    if (!emailSent) {
      console.warn('[Contact] Email notification failed, but form submission recorded');
    }

    res.status(200).json({
      message: 'Contact form submitted successfully. We will get back to you soon.',
      success: true
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

export default contactRouter;
