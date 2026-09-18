# DocuBlog Studio

Edit and preview Markdown without logging in. Sign in with Supabase email codes only when saving a private draft, publishing a blog, or creating a short link. Viewers can read published links without logging in.

## Storage approach

Supabase Postgres stores each published blog (Markdown, title, author, avatar, font, theme, and profile links) and each URL destination. Next.js API routes validate requests and access Supabase through its REST API using a server-only key. Deploy Next.js to a serverless host such as Vercel; Supabase handles authentication and database storage. There is no separate backend service to maintain. A static-only export cannot resolve stored links.

- `POST /api/drafts` saves or updates a private draft for the authenticated user.
- `GET /api/library` lists the authenticated user’s drafts, published blogs, and short links.
- `POST /api/blogs` publishes an immutable snapshot and returns its short URL.
- `POST /api/links` stores an HTTP/HTTPS destination and returns its short URL.
- `/s/<code>` resolves a short code and redirects to a blog or external URL.
- `/b/<code>` displays the stored blog with no editor controls.

Anyone with a blog link can read it. Publishing again creates a new snapshot and link. Saved drafts stay private and can be reopened and updated from **My saved blogs & links** on any device after login. Login uses an email code inside a modal, preserves the editor, and resumes the save/share action. Cancelling returns to the editor without saving or publishing. Exporting Markdown/HTML and printing do not require login.

All write routes and the private library verify access tokens with Supabase Auth. The server derives ownership from the verified user, ignoring any user ID supplied by the browser. Existing anonymous links from the previous schema remain readable, but are not assigned to a user. Unpublished editor content is not saved across reloads.

## Set up the database

1. Create a Supabase project and run (or rerun) [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env.local`.
3. Set both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` to the same project URL. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the publishable (`sb_publishable_...`) or legacy anon key. Set `SUPABASE_SECRET_KEY` to its server secret key (`sb_secret_...`) or legacy `service_role` key. Never put that key in a `NEXT_PUBLIC_` variable or client code. The server storage key must be a secret/service-role key; the public key is used only for authentication.
4. Enable Supabase Email authentication. In **Authentication → Email Templates**, configure the **Magic Link** and **Confirm Signup** templates to include a code instead of requiring a link:

   ```html
   <h2>Your DocuBlog login code</h2>
   <p>Enter this code in the app: {{ .Token }}</p>
   ```

   Supabase’s default OTP method sends a magic link unless these templates include the token. New email addresses create an account automatically. Configure your production Site URL and email delivery/SMTP in Supabase.
5. Run `npm install` and `npm run dev`, then open http://localhost:3000.
6. Open the studio, enter a blog title and content, and click **Save draft** or **Publish & share**. Sign in with your email code when prompted. Use **Shorten URL** for other links.

For public sharing, deploy the app to a Next.js host and set the same server environment variables there. Links created on localhost are for local testing; publish from the deployed domain to create links others can open. Changing the domain requires keeping redirects from the old domain.

## Validation and access

Database row-level security blocks direct access through public keys. Only server routes read and create entries. Raw Markdown HTML is sanitized before rendering, profile links are checked, requests are limited to 1 MB, blog content is limited to 200,000 characters, and only HTTP/HTTPS URLs without embedded credentials can be shortened. Short-link destinations are redirected to, never fetched by the server.

The database enforces 20 new drafts, publications, and short links per account per hour-long window, shared across server instances. Updating an existing draft does not consume this creation quota. User IDs are hashed in quota records; expired quota rows are deleted by the SQL function.

## Checks

```sh
npm run test
npm run lint
npm run build
npm run test:integration
```

The unit tests exercise validation and streamed request-size limits. The integration test runs the production build against a local Supabase REST fixture and checks authentication enforcement, private draft ownership and updates, account libraries, public viewing, viewer sanitization, redirects, short-code collision retries, and quota errors. Verification against your live database requires the Supabase setup above.

References: [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Supabase REST API](https://supabase.com/docs/guides/api), [Supabase server keys](https://supabase.com/docs/guides/getting-started/api-keys), [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
