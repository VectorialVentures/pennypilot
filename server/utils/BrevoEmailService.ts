interface EmailRecipient {
  email: string
  name?: string
}

interface EmailTemplateData {
  [key: string]: any
}

interface EmailOptions {
  to: EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  templateId?: number
  htmlContent?: string
  textContent?: string
  templateData?: EmailTemplateData
  attachments?: Array<{
    name: string
    content: string // base64 encoded
    contentType: string
  }>
}

export class BrevoEmailService {
  private apiKey: string
  private baseUrl: string = 'https://api.brevo.com/v3'
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Brevo API key is required')
    }
    this.apiKey = apiKey
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload = {
        sender: {
          name: 'PennyPilot',
          email: 'noreply@pennypilot.com'
        },
        to: options.to,
        ...(options.cc && { cc: options.cc }),
        ...(options.bcc && { bcc: options.bcc }),
        subject: options.subject,
        ...(options.templateId && { templateId: options.templateId }),
        ...(options.htmlContent && { htmlContent: options.htmlContent }),
        ...(options.textContent && { textContent: options.textContent }),
        ...(options.templateData && { params: options.templateData }),
        ...(options.attachments && { attachment: options.attachments })
      }

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Brevo API error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async sendTransactionalEmail(
    to: string | EmailRecipient,
    subject: string,
    templateType: 'informational' | 'action',
    data: {
      title: string
      content: string
      userName?: string
      actionUrl?: string
      actionText?: string
      footerText?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipient = typeof to === 'string' ? { email: to } : to

    // Generate HTML using our custom template
    const htmlContent = this.generateTemplate(templateType, data)
    const textContent = this.generateTextTemplate(data)

    return this.sendEmail({
      to: [recipient],
      subject,
      htmlContent,
      textContent
    })
  }

  private generateTemplate(
    type: 'informational' | 'action',
    data: {
      title: string
      content: string
      userName?: string
      actionUrl?: string
      actionText?: string
      footerText?: string
    }
  ): string {
    const greeting = data.userName ? `Hi ${data.userName}` : 'Hi there'
    const actionSection = type === 'action' && data.actionUrl && data.actionText ? 
      this.generateActionSection(data.actionUrl, data.actionText) : ''

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background-color: #0a0a0f;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            position: relative;
            overflow: hidden;
        }
        
        /* Background effects */
        .bg-effects {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .gradient-orb-1 {
            position: absolute;
            top: -100px;
            right: -100px;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .gradient-orb-2 {
            position: absolute;
            bottom: -100px;
            left: -100px;
            width: 250px;
            height: 250px;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        /* Content */
        .email-content {
            position: relative;
            z-index: 2;
            padding: 40px 30px;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo {
            display: inline-block;
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-decoration: none;
            margin-bottom: 20px;
        }
        
        /* Main content */
        .content-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px 30px;
            margin-bottom: 30px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 15px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 20px;
            line-height: 1.3;
        }
        
        .content {
            font-size: 16px;
            color: #e5e7eb;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .content p {
            margin-bottom: 16px;
        }
        
        /* Action button */
        .action-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            padding: 16px 32px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4);
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 30px;
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.5;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            margin: 0 15px;
            color: #9ca3af;
            text-decoration: none;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-content {
                padding: 30px 20px;
            }
            
            .content-card {
                padding: 30px 20px;
            }
            
            .title {
                font-size: 20px;
            }
            
            .cta-button {
                padding: 14px 24px;
                font-size: 15px;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Background Effects -->
        <div class="bg-effects">
            <div class="gradient-orb-1"></div>
            <div class="gradient-orb-2"></div>
        </div>
        
        <!-- Email Content -->
        <div class="email-content">
            <!-- Header -->
            <div class="header">
                <div class="logo">PennyPilot</div>
            </div>
            
            <!-- Main Content -->
            <div class="content-card">
                <div class="greeting">${greeting}!</div>
                <h1 class="title">${data.title}</h1>
                <div class="content">
                    ${data.content.split('\n').map(line => `<p>${line}</p>`).join('')}
                </div>
                ${actionSection}
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>${data.footerText || 'Thanks for using PennyPilot!'}</p>
                <div class="footer-links">
                    <a href="https://pennypilot.com">Dashboard</a>
                    <a href="https://pennypilot.com/support">Support</a>
                    <a href="https://pennypilot.com/privacy">Privacy</a>
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                    This email was sent by PennyPilot. If you no longer wish to receive these emails, 
                    <a href="#" style="color: #3b82f6;">unsubscribe here</a>.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
  }

  private generateActionSection(actionUrl: string, actionText: string): string {
    return `
        <div class="action-section">
            <a href="${actionUrl}" class="cta-button">${actionText}</a>
        </div>
    `
  }

  private generateTextTemplate(data: {
    title: string
    content: string
    userName?: string
    actionUrl?: string
    actionText?: string
  }): string {
    const greeting = data.userName ? `Hi ${data.userName}` : 'Hi there'
    const actionSection = data.actionUrl && data.actionText ? 
      `\n\n${data.actionText}: ${data.actionUrl}\n` : ''

    return `
${greeting}!

${data.title}

${data.content}
${actionSection}

Thanks for using PennyPilot!

---
This email was sent by PennyPilot
Visit: https://pennypilot.com
Support: https://pennypilot.com/support
`.trim()
  }

  async sendWelcomeEmail(
    to: string,
    userName: string,
    setupUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      'Welcome to PennyPilot! 🚀',
      setupUrl ? 'action' : 'informational',
      {
        title: 'Welcome to PennyPilot!',
        content: `We're excited to have you on board! PennyPilot is your AI-powered investment companion that helps you make smarter financial decisions.

${setupUrl ? 'To get started, please set up your password and complete your profile.' : 'Your account is ready and you can start building your investment portfolio right away.'}

If you have any questions, our support team is here to help.`,
        userName,
        actionUrl: setupUrl,
        actionText: setupUrl ? 'Set Up Your Account' : undefined,
        footerText: 'Welcome to the future of smart investing!'
      }
    )
  }

  async sendPasswordSetupEmail(
    to: string,
    userName: string,
    setupUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      'Complete Your PennyPilot Account Setup',
      'action',
      {
        title: 'Set Up Your Password',
        content: `Thank you for subscribing to PennyPilot! To complete your account setup, please create a secure password.

Your setup link is valid for 24 hours. If you need a new link, please contact our support team.`,
        userName,
        actionUrl: setupUrl,
        actionText: 'Set Up Password',
        footerText: 'Secure your account and start investing smarter!'
      }
    )
  }

  async sendPortfolioUpdateEmail(
    to: string,
    userName: string,
    portfolioData: {
      portfolioName: string
      currentValue: number
      change: number
      changePercent: number
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const changeDirection = portfolioData.change >= 0 ? 'up' : 'down'
    const changeEmoji = portfolioData.change >= 0 ? '📈' : '📉'
    
    return this.sendTransactionalEmail(
      to,
      `Portfolio Update: ${portfolioData.portfolioName} ${changeEmoji}`,
      'informational',
      {
        title: `Your ${portfolioData.portfolioName} Update`,
        content: `Here's your latest portfolio performance:

Current Value: $${portfolioData.currentValue.toLocaleString()}
Change: ${portfolioData.change >= 0 ? '+' : ''}$${portfolioData.change.toLocaleString()} (${portfolioData.changePercent >= 0 ? '+' : ''}${portfolioData.changePercent.toFixed(2)}%)

Your portfolio is ${changeDirection} ${changeEmoji}. Keep up the great work with your investment strategy!`,
        userName,
        footerText: 'Stay informed, invest smarter with PennyPilot!'
      }
    )
  }

  async sendPaymentFailureEmail(
    to: string,
    userName: string,
    billingPortalUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      'Payment Issue - Action Required',
      'action',
      {
        title: 'Payment Update Needed',
        content: `We encountered an issue processing your payment for your PennyPilot subscription.

Don't worry - your account is still active, but please update your payment method to ensure uninterrupted service.

You can securely update your payment information through your billing portal.`,
        userName,
        actionUrl: billingPortalUrl,
        actionText: 'Update Payment Method',
        footerText: 'Questions? Our support team is here to help!'
      }
    )
  }

  async sendSubscriptionCancelledEmail(
    to: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      'Your PennyPilot Subscription',
      'informational',
      {
        title: 'Subscription Cancelled',
        content: `Your PennyPilot subscription has been cancelled as requested.

You'll continue to have access to your account until the end of your current billing period. After that, your account will be moved to our free tier.

We're sorry to see you go! If you change your mind, you can reactivate your subscription at any time from your account settings.`,
        userName,
        footerText: 'Thank you for being part of the PennyPilot community!'
      }
    )
  }

  async sendTrialEndingEmail(
    to: string,
    userName: string,
    daysLeft: number,
    upgradeUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      `Your PennyPilot trial ends in ${daysLeft} days`,
      'action',
      {
        title: `${daysLeft} Days Left in Your Trial`,
        content: `You have ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining in your PennyPilot trial.

We hope you've been enjoying the AI-powered investment insights and portfolio management features! To continue accessing all premium features, please choose a subscription plan.

Don't lose your progress - upgrade now to keep your portfolios, recommendations, and insights.`,
        userName,
        actionUrl: upgradeUrl,
        actionText: 'Choose Your Plan',
        footerText: 'Questions about plans? Contact our support team!'
      }
    )
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendTransactionalEmail(
      to,
      'Reset Your PennyPilot Password',
      'action',
      {
        title: 'Password Reset Request',
        content: `You requested a password reset for your PennyPilot account.

Click the button below to create a new password. This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email - your account remains secure.`,
        userName,
        actionUrl: resetUrl,
        actionText: 'Reset Password',
        footerText: 'Keep your account secure!'
      }
    )
  }
}

// Helper function to create email service instance
export function createEmailService(): BrevoEmailService {
  const config = useRuntimeConfig()
  
  if (!config.brevoApiKey) {
    throw new Error('Brevo API key not configured')
  }
  
  return new BrevoEmailService(config.brevoApiKey)
}