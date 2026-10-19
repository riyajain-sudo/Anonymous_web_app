This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Maintainer notes (review remediation)

- Public message submissions are server-validated (10–300 characters), request bodies are capped at 8 KiB, and each inbox retains at most 100 recent messages. Messages are appended only while acceptance is enabled.
- Registration uses the server-side Zod schema and sends one React-template verification email; verification codes are generated with a cryptographic RNG and invalidated after successful verification.
- Configure `MONGODB_URI`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, and `OPENAI_API_KEY` as deployment secrets. Never commit real values.
- The supplied archive snapshot was extracted into `anonymousMessages-main/`; the original ZIP remains preserved at the repository root.


### API resource bounds

The public suggestion endpoint limits each process-local client bucket to 10 requests per hour, caps history and generated output, and validates request bodies before invoking the model. The local counter is a defense-in-depth limit, not a distributed quota: configure an authoritative rate limit at the hosting gateway, and ensure that gateway overwrites `x-real-ip`/`x-forwarded-for`. Inbox appends validate 10–300 character messages, cap body size and retain at most 100 entries.
