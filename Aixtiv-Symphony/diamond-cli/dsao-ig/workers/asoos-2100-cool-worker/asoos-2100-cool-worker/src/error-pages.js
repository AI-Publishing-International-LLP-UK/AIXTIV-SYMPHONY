/**
 * Error Pages Handler for ASOOS
 * Custom error pages for 522, 502, and other server errors
 */

export class ErrorHandler {
  static create522Page() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS - Service Temporarily Unavailable</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Montserrat', sans-serif;
            background: #0a0a0a;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .error-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px 35px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
        }
        .logo {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #0bb1bb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }
        .error-title {
            color: #ff6b6b;
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .error-message {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9em;
            line-height: 1.5;
            margin-bottom: 25px;
        }
        .retry-btn {
            background: linear-gradient(135deg, #00d4aa 0%, #0bb1bb 50%, #00c4a0 100%);
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-size: 0.9em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(11, 177, 187, 0.4);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="logo">ASOOS</div>
        <div class="error-title">Service Temporarily Unavailable</div>
        <div class="error-message">
            Our AI agents are currently being updated with divine wisdom. 
            Please try again in a few moments.
        </div>
        <button class="retry-btn" onclick="window.location.reload()">
            Retry Connection
        </button>
    </div>
    
    <script>
        // Auto-retry after 10 seconds
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    </script>
</body>
</html>`;
  }

  static handle522Error(request) {
    return new Response(this.create522Page(), {
      status: 522,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Error-Type': 'Connection-Timeout',
        'Retry-After': '10',
      },
    });
  }

  static handleGenericError(error, request) {
    console.error('Worker error:', error);
    
    return new Response(this.create522Page(), {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Error-Type': 'Internal-Server-Error',
      },
    });
  }
}
