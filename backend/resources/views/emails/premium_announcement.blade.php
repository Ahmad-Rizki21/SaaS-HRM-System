<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f7f9;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #8B0000;
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1a1a1a;
        }
        .announcement-box {
            background-color: #f9f9f9;
            border-left: 4px solid #8B0000;
            padding: 25px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .announcement-title {
            font-size: 16px;
            font-weight: 900;
            color: #8B0000;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .announcement-text {
            color: #4a4a4a;
            white-space: pre-wrap;
        }
        .footer {
            background-color: #fafafa;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
        .button {
            display: inline-block;
            padding: 14px 30px;
            background-color: #8B0000;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
            box-shadow: 0 4px 12px rgba(139, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PENGUMUMAN RESMI</h1>
        </div>
        <div class="content">
            <div class="greeting">Halo, {{ $member->name }}!</div>
            <p>Terdapat informasi penting yang perlu Anda ketahui dari Manajemen Narwasthu Arthatama.</p>
            
            <div class="announcement-box">
                <div class="announcement-title">{{ $title }}</div>
                <div class="announcement-text">{{ $announcement_content }}</div>
            </div>
            
            <p>Silakan klik tautan di bawah ini untuk melihat detail lengkap di Dashboard Anda:</p>
            
            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/dashboard/announcements" class="button">Buka Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} <b>Narwasthu Arthatama Group</b><br>Sistem Manajemen SDM Terintegrasi</p>
            <p style="font-size: 10px;">Email ini dikirim secara otomatis oleh sistem, mohon tidak membalas email ini.</p>
        </div>
    </div>
</body>
</html>
