# Mailstack Deployment Package

## Quick Deploy Steps

1. **Delete existing `api/` folder** in cPanel File Manager
2. **Upload this zip** and Extract
3. **Edit `api/config/database.php`** - change `YOUR_PASSWORD_HERE` to your database password
4. **Update root `.htaccess`** (copy content from `dist/.htaccess` or use content below)

## Root .htaccess Content

Copy this to your root `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite API requests - let them go to PHP files
  RewriteRule ^api/ - [L]
  
  # SPA routing for everything else
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## Test Endpoints

After deployment, test these URLs:
- https://mailstack.shop/api/auth/login.php → Should show `{"error":"Method not allowed"}`
- https://mailstack.shop/api/admin/dashboard.php → Should show `{"error":"Unauthorized"}`

If you see these JSON responses, the API is working!

## Login Credentials

- **Admin:** admin@mailstack.com / admin123
- **Supplier:** john.supplier@example.com / password123

## Files Included

### API Endpoints
- `api/config/database.php` - Database config (EDIT PASSWORD!)
- `api/auth/` - Login, Register, Me
- `api/admin/` - Dashboard, Gmails, Suppliers, Settings, Payments, Payouts
- `api/supplier/` - Dashboard, Submissions, Leaderboard, Payments

### Frontend
- `dist/.htaccess` - SPA routing with API exception
