<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #8B0000; text-align: center;">Reset Password Akun Anda</h2>
        <p>Anda menerima email ini karena kami menerima permintaan untuk mengatur ulang kata sandi (reset password) untuk akun HRMS Anda.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" style="background-color: #8B0000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password Sekarang</a>
        </div>

        <p>Tautan reset password ini akan kedaluwarsa dalam 60 menit.</p>
        <p>Jika Anda tidak meminta reset password, Anda tidak perlu melakukan tindakan apapun.</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Jika Anda bermasalah menekan tombol di atas, silakan salin dan tempel URL berikut ke browser web Anda: <br><a href="{{ $resetUrl }}" style="color: #8B0000; word-break: break-all;">{{ $resetUrl }}</a></p>
    </div>
</body>
</html>
