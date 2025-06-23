import { NextRequest, NextResponse } from 'next/server'

// 本番環境でのメール送信API
export async function POST(request: NextRequest) {
  try {
    const { to, subject, textContent, htmlContent } = await request.json()

    // SendGridを使用する場合の実装例
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: to,
        from: process.env.FROM_EMAIL || 'noreply@textmatch.com',
        subject: subject,
        text: textContent,
        html: htmlContent || textContent,
      }

      await sgMail.send(msg)
      
      return NextResponse.json({ success: true, message: 'メール送信完了' })
    }

    // AWS SESを使用する場合の実装例
    /*
    const AWS = require('aws-sdk')
    
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    })

    const ses = new AWS.SES({ apiVersion: '2010-12-01' })

    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlContent || textContent,
          },
          Text: {
            Charset: 'UTF-8',
            Data: textContent,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: process.env.FROM_EMAIL || 'noreply@textmatch.com',
    }

    await ses.sendEmail(params).promise()
    return NextResponse.json({ success: true, message: 'メール送信完了' })
    */

    return NextResponse.json(
      { success: false, message: 'メール送信サービスが設定されていません' },
      { status: 500 }
    )
  } catch (error) {
    console.error('メール送信エラー:', error)
    return NextResponse.json(
      { success: false, message: 'メール送信に失敗しました' },
      { status: 500 }
    )
  }
}