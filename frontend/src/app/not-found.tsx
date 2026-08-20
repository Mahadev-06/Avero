export default function NotFound() {
  return (
    <div className="container py-32 text-center flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-6">Page Not Found</h2>
      <p className="text-muted mb-8 max-w-md mx-auto">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a href="/" className="btn btn-primary">Return Home</a>
    </div>
  );
}
