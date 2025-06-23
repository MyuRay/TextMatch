// メール送信サービス
// 実際の本番環境では、SendGrid, AWS SES, Nodemailer等を使用

export interface EmailNotification {
  to: string
  subject: string
  textContent: string
  htmlContent?: string
}

export const sendEmailNotification = async (notification: EmailNotification): Promise<boolean> => {
  try {
    // 本番環境でのメール送信
    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
      // SendGridを使用したメール送信
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
      
      if (!response.ok) {
        throw new Error('メール送信APIエラー')
      }
      
      console.log('📧 メール送信完了:', notification.to)
      return true
    } else {
      // テスト運用中はコンソールログのみ
      console.log('📧 メール通知送信（テスト運用中）:')
      console.log('宛先:', notification.to)
      console.log('件名:', notification.subject)
      console.log('内容:', notification.textContent)
      console.log('---')
      
      // テスト用: 成功として返す
      return true
    }
  } catch (error) {
    console.error('メール送信エラー:', error)
    return false
  }
}

// メッセージ通知用のメールテンプレート
export const createMessageNotificationEmail = (
  recipientName: string,
  senderName: string,
  bookTitle: string,
  messagePreview: string
): EmailNotification => {
  const subject = `[TextMatch] ${bookTitle}について新しいメッセージが届きました`
  
  const textContent = `
${recipientName}さん

あなたの出品した教科書「${bookTitle}」について、${senderName}さんから新しいメッセージが届きました。

メッセージの内容:
"${messagePreview}"

詳細を確認してやり取りを続けるには、以下のリンクからTextMatchにログインしてください。
https://textmatch.com/messages

このメールは自動送信されています。

---
TextMatch チーム
  `.trim()

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">新しいメッセージが届きました</h2>
      
      <p>こんにちは、${recipientName}さん</p>
      
      <p>あなたの出品した教科書「<strong>${bookTitle}</strong>」について、<strong>${senderName}</strong>さんから新しいメッセージが届きました。</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${messagePreview}"</p>
      </div>
      
      <p>詳細を確認してやり取りを続けるには、以下のボタンをクリックしてTextMatchにログインしてください。</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://textmatch.com/messages" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          メッセージを確認する
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        このメールは自動送信されています。<br>
        TextMatch チーム
      </p>
    </div>
  `

  return {
    to: '',
    subject,
    textContent,
    htmlContent
  }
}