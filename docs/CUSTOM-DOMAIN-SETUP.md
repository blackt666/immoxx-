# Custom Domain Setup Guide - Bodensee Immobilien

## 🌐 Vercel Custom Domain Configuration

This guide walks you through setting up a custom domain for your Bodensee Immobilien platform deployed on Vercel.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Successfully deployed your app to Vercel
- ✅ Access to your domain registrar account (e.g., GoDaddy, Namecheap, Google Domains)
- ✅ Admin access to Vercel project dashboard

---

## Step 1: Add Domain in Vercel Dashboard

### 1.1 Navigate to Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Bodensee Immobilien** project
3. Click on **Settings** tab
4. Click on **Domains** in the sidebar

### 1.2 Add Your Custom Domain

1. In the **Domains** section, enter your domain name:
   - For root domain: `example.com`
   - For subdomain: `www.example.com`
   - For both: Add them separately

2. Click **Add** button

3. Vercel will show you the DNS configuration needed

---

## Step 2: Configure DNS Records

### Option A: Using a Root Domain (example.com)

Add these records in your domain registrar's DNS settings:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Alternative using CNAME (if supported):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### Option B: Using WWW Subdomain (www.example.com)

Add this record:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Option C: Both Root and WWW (Recommended)

1. Add A record for root domain (see Option A)
2. Add CNAME for www subdomain (see Option B)
3. Set up redirect in Vercel to automatically redirect www to root or vice versa

---

## Step 3: DNS Provider Specific Instructions

### GoDaddy

1. Log in to GoDaddy account
2. Navigate to **My Products** → **Domains**
3. Click **DNS** next to your domain
4. Click **Add** to create new records
5. Add the records as specified above
6. Save changes

### Namecheap

1. Log in to Namecheap account
2. Navigate to **Domain List** → Select domain
3. Click **Advanced DNS** tab
4. Add new records using **Add New Record** button
5. Save changes

### Cloudflare

1. Log in to Cloudflare dashboard
2. Select your domain
3. Click **DNS** tab
4. Add the records as specified
5. **Important:** Set proxy status to "DNS only" (gray cloud) initially
6. After successful verification, you can enable proxy (orange cloud)

### Google Domains

1. Log in to Google Domains
2. Select your domain
3. Click **DNS** in left sidebar
4. Scroll to **Custom resource records**
5. Add the records as specified
6. Save changes

---

## Step 4: Verify Domain Configuration

### In Vercel Dashboard

1. Go back to Vercel **Domains** settings
2. Click **Refresh** or wait a few minutes
3. Vercel will automatically verify the DNS records
4. Status should change from "Pending" to "Active"

### DNS Propagation Time

- **Typical wait time:** 5-30 minutes
- **Maximum wait time:** Up to 48 hours (rare)
- **Check propagation:** Use [WhatsMyDNS.net](https://www.whatsmydns.net/)

---

## Step 5: SSL Certificate Configuration

### Automatic SSL (Default)

Vercel **automatically provides free SSL certificates** using Let's Encrypt:

- ✅ Automatically issued after domain verification
- ✅ Auto-renewal every 90 days
- ✅ Covers both root and www domains
- ✅ HTTPS enforced by default

### Verify SSL Certificate

1. Wait 2-5 minutes after domain verification
2. Visit `https://yourdomain.com`
3. Check for the padlock icon in browser
4. Certificate should be valid and issued by "Let's Encrypt"

### Troubleshooting SSL

If SSL certificate doesn't activate:

1. **Check DNS records** are correct
2. **Remove and re-add domain** in Vercel
3. **Wait longer** (up to 1 hour)
4. **Contact Vercel support** if issues persist

---

## Step 6: Configure Domain Redirects

### Redirect WWW to Root (or vice versa)

1. In Vercel **Domains** settings
2. Both `example.com` and `www.example.com` should be added
3. Vercel automatically handles redirects
4. Choose primary domain (non-www or www)

### Custom Redirects

Edit `vercel.json` in your project:

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

---

## Step 7: Update Environment Variables

### Update Allowed Origins

If you have CORS configuration, update your environment variables:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Update in Vercel

1. Go to **Settings** → **Environment Variables**
2. Edit relevant variables
3. **Redeploy** to apply changes

---

## Step 8: Test Your Domain

### Checklist

- [ ] Visit `https://yourdomain.com` - should load site
- [ ] Visit `http://yourdomain.com` - should redirect to HTTPS
- [ ] Check SSL certificate (padlock icon)
- [ ] Test on mobile device
- [ ] Verify email links work (if applicable)
- [ ] Check all navigation links
- [ ] Test admin login at `https://yourdomain.com/admin/login`

---

## Common Issues & Solutions

### Issue 1: Domain Not Verifying

**Symptoms:** Domain stuck in "Pending" state

**Solutions:**
- Check DNS records are exactly as specified
- Remove any conflicting records (multiple A or CNAME for same name)
- Wait longer (DNS propagation can take time)
- Clear your browser cache
- Try different DNS checker tool

### Issue 2: SSL Certificate Not Issuing

**Symptoms:** "Not Secure" warning in browser

**Solutions:**
- Wait 1-2 hours for certificate issuance
- Ensure DNS records are correct
- Remove and re-add domain in Vercel
- Check if domain is behind CloudFlare (disable proxy temporarily)

### Issue 3: WWW Not Redirecting

**Symptoms:** www and non-www show different content

**Solutions:**
- Add both domains in Vercel
- Vercel will automatically set up redirect
- Choose which version is primary

### Issue 4: Old Content Showing

**Symptoms:** Changes not appearing on custom domain

**Solutions:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Clear CDN cache in Vercel
- Redeploy project
- Check DNS is pointing to correct Vercel deployment

---

## Performance Optimization for Custom Domain

### Enable Vercel Analytics

1. Go to **Analytics** tab in Vercel dashboard
2. Enable **Web Analytics**
3. Get insights on page performance

### Configure Caching Headers

In your `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Use Vercel Edge Network

- Already active by default
- Your site is served from 100+ global edge locations
- Automatic CDN for static assets

---

## Domain Email Configuration (Optional)

### Using Google Workspace

1. Purchase Google Workspace for your domain
2. Add MX records provided by Google:

```
Type: MX
Priority: 1
Value: ASPMX.L.GOOGLE.COM
```

3. Add TXT record for verification

### Using Custom Email Provider

Follow your email provider's DNS configuration guide.

**Common providers:**
- Microsoft 365
- Zoho Mail
- ProtonMail
- Mail.com

---

## Security Considerations

### Enable HTTPS Only

In `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Set Security Headers

Already configured in `server/index.ts` with Helmet middleware:
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Content-Security-Policy

---

## Monitoring & Maintenance

### Monitor Domain Health

1. **Vercel Dashboard** → Analytics
   - Page views
   - Response times
   - Error rates

2. **Google Search Console**
   - Add your domain
   - Monitor SEO performance
   - Check for indexing issues

3. **SSL Certificate Monitoring**
   - Vercel auto-renews certificates
   - Monitor expiration dates (just in case)
   - Set up alerts for certificate issues

### Regular Checks

- ✅ **Weekly:** Check site is accessible
- ✅ **Monthly:** Review analytics
- ✅ **Quarterly:** Audit DNS configuration
- ✅ **Annually:** Review domain registration

---

## Multiple Domains / Subdomains

### Add Multiple Domains

You can add multiple domains to same project:

1. Main domain: `bodensee-immobilien.de`
2. Alternative: `bodensee-immobilien.com`
3. Subdomain: `app.bodensee-immobilien.de`

All point to same deployment, or use branch deployments for different subdomains.

### Branch-Based Domains

- Production: `yourdomain.com` → `main` branch
- Staging: `staging.yourdomain.com` → `staging` branch
- Preview: `preview.yourdomain.com` → `preview` branch

Configure in Vercel project settings.

---

## Cost Considerations

### Vercel Pricing

- **Hobby Plan:** FREE
  - Includes SSL certificates
  - Custom domains included
  - No additional cost for domain on Vercel

### Domain Costs

- **Domain registration:** $10-15/year (varies by TLD)
- **Domain privacy:** Often included or $1-5/year
- **Email hosting:** $6-12/month (Google Workspace)

### Recommended Plan for Production

**Vercel Pro ($20/month):**
- Better performance
- Priority support
- Advanced analytics
- Team collaboration
- No cold starts

---

## Support Resources

### Vercel Documentation

- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/custom-domains)
- [SSL/TLS Configuration](https://vercel.com/docs/concepts/projects/custom-domains#ssl)
- [DNS Configuration](https://vercel.com/docs/concepts/projects/custom-domains#dns-configuration)

### Community Support

- [Vercel Discord](https://vercel.com/discord)
- [GitHub Discussions](https://github.com/vercel/vercel/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vercel)

### Contact Information

- **Vercel Support:** support@vercel.com
- **Enterprise Support:** Available with Pro/Enterprise plans

---

## Quick Reference Commands

### Check DNS Propagation

```bash
# Using dig
dig yourdomain.com

# Using nslookup
nslookup yourdomain.com

# Using host
host yourdomain.com
```

### Test SSL Certificate

```bash
# Using openssl
openssl s_client -connect yourdomain.com:443

# Using curl
curl -vI https://yourdomain.com
```

### Verify Vercel Deployment

```bash
# Using vercel CLI
vercel domains ls

# Check current deployment
vercel ls
```

---

## Checklist: Domain Setup Complete ✅

- [ ] Domain added in Vercel dashboard
- [ ] DNS records configured at registrar
- [ ] Domain verified in Vercel
- [ ] SSL certificate issued and active
- [ ] HTTPS redirect working
- [ ] WWW redirect configured (if applicable)
- [ ] Environment variables updated
- [ ] Site tested on custom domain
- [ ] Mobile testing completed
- [ ] Analytics configured
- [ ] Google Search Console added
- [ ] Documentation updated with new domain

---

## Conclusion

Your Bodensee Immobilien platform is now accessible via your custom domain with:
- ✅ HTTPS encryption
- ✅ Global CDN distribution
- ✅ Automatic SSL renewal
- ✅ Professional branding

**Next steps:**
1. Monitor site performance
2. Set up analytics
3. Configure email for domain
4. Promote your new domain

---

**Need help?** Contact Vercel support or refer to the official documentation.

**Last updated:** $(date +%Y-%m-%d)
