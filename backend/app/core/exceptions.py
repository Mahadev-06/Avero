from __future__ import annotations
import uuid

class MediaFlowError(Exception):
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR"):
        self.message = message
        self.error_code = error_code
        self.error_id = str(uuid.uuid4())
        super().__init__(self.message)

class PlatformNotSupportedError(MediaFlowError):
    def __init__(self, message: str = "Platform not supported"):
        super().__init__(message, "PLATFORM_NOT_SUPPORTED")

class PlatformDownloadNotSupportedError(MediaFlowError):
    def __init__(self, message: str = "Downloading from this platform is not supported"):
        super().__init__(message, "PLATFORM_DOWNLOAD_NOT_SUPPORTED")

class URLValidationError(MediaFlowError):
    def __init__(self, message: str = "Invalid URL provided"):
        super().__init__(message, "URL_VALIDATION_ERROR")

class SSRFBlockedError(MediaFlowError):
    def __init__(self, message: str = "SSRF attempt blocked"):
        super().__init__(message, "SSRF_BLOCKED")

class RateLimitExceededError(MediaFlowError):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_EXCEEDED")

class JobNotFoundError(MediaFlowError):
    def __init__(self, message: str = "Job not found"):
        super().__init__(message, "JOB_NOT_FOUND")

class FileSecurityError(MediaFlowError):
    def __init__(self, message: str = "File security violation"):
        super().__init__(message, "FILE_SECURITY_ERROR")

class FileSizeLimitError(MediaFlowError):
    def __init__(self, message: str = "File size limit exceeded"):
        super().__init__(message, "FILE_SIZE_LIMIT_ERROR")

class JobTimeoutError(MediaFlowError):
    def __init__(self, message: str = "Job timed out"):
        super().__init__(message, "JOB_TIMEOUT_ERROR")
