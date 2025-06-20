// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#d1d5db', margin: '0 0 1rem 0' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', margin: '0 0 1rem 0' }}>
          ページが見つかりません
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          お探しのページは存在しないか、移動または削除された可能性があります。
        </p>
        <a 
          href="/"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ホームに戻る
        </a>
      </div>
    </div>
  )
}