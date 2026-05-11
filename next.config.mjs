import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' }
    ]
  }
};

export default withNextIntl(nextConfig);
