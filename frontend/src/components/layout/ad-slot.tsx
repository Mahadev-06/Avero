export function AdSlot({ placement }: { placement: string }) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100px',
        backgroundColor: 'var(--card-bg)',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-sm)',
        fontWeight: 500
      }}>
        Ad Slot Placeholder ({placement})
      </div>
    );
  }

  return <div id={`ad-${placement}`} className="ad-container" />;
}
