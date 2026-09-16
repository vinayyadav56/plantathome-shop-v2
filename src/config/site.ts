import { Routes } from '@/config/routes';
import { PaymentGateway } from '@/types';

export const siteSettings = {
  name: 'PlantAtHome',
  description: '',
  logo: {
    url: '/logo.svg',
    alt: 'PlantAtHome',
    href: '/plants',
    width: 210,
    height: 46,
  },
  defaultLanguage: 'en',
  currencyCode: 'INR',
  product: {
    placeholderImage: '/product-placeholder.svg',
    cardMaps: {
      grocery: 'Krypton',
      furniture: 'Radon',
      bag: 'Oganesson',
      makeup: 'Neon',
      book: 'Xenon',
      medicine: 'Helium',
      default: 'Argon',
    },
  },
  authorizedLinks: [
    { href: Routes.profile, label: 'auth-menu-profile' },
    { href: Routes.orders, label: 'auth-menu-my-orders' },
    { href: Routes.wishlists, label: 'profile-sidebar-my-wishlist' },
    { href: Routes.checkout, label: 'auth-menu-checkout' },
  ],
  authorizedLinksMobile: [
    { href: Routes.profile, label: 'auth-menu-profile' },
    { href: Routes.notifyLogs, label: 'profile-sidebar-notifications' },
    { href: Routes.orders, label: 'auth-menu-my-orders' },
    { href: Routes.cards, label: 'profile-sidebar-my-cards' },
    { href: Routes.wishlists, label: 'profile-sidebar-my-wishlist' },
    { href: Routes.questions, label: 'profile-sidebar-my-questions' },
    { href: Routes.refunds, label: 'text-my-refunds' },
    { href: Routes.reports, label: 'profile-sidebar-my-reports' },
    { href: Routes.checkout, label: 'auth-menu-checkout' },
    { href: Routes.changePassword, label: 'profile-sidebar-password' },
  ],
  // Order matches the account-page reference; Change Password + the two
  // conditionally-shown items (notifications, cards) sit after the primary set.
  dashboardSidebarMenu: [
    {
      href: Routes.profile,
      label: 'profile-sidebar-profile',
    },
    {
      href: Routes.orders,
      label: 'profile-sidebar-orders',
    },
    {
      href: Routes.myPackages,
      label: 'My Garden Packages',
    },
    {
      href: Routes.downloads,
      label: 'profile-sidebar-downloads',
    },
    {
      href: Routes.wishlists,
      label: 'profile-sidebar-my-wishlist',
    },
    {
      href: Routes.questions,
      label: 'profile-sidebar-my-questions',
    },
    {
      href: Routes.refunds,
      label: 'text-my-refunds',
    },
    {
      href: Routes.reports,
      label: 'profile-sidebar-my-reports',
    },
    {
      href: Routes.help,
      label: 'profile-sidebar-help',
    },
    {
      href: Routes.changePassword,
      label: 'profile-sidebar-password',
    },
    {
      href: Routes.notifyLogs,
      label: 'profile-sidebar-notifications',
    },
    {
      href: Routes.cards,
      label: 'profile-sidebar-my-cards',
      // MultiPayment: Make it dynamic or from mapper
      cardsPayment: [PaymentGateway.STRIPE],
    },
    {
      href: Routes.logout,
      label: 'profile-sidebar-logout',
    },
  ],
  sellingAdvertisement: {
    image: {
      src: '/selling.png',
      alt: 'Selling Advertisement',
    },
  },
  cta: {
    mockup_img_src: '/mockup-img.png',
    // Empty string = not on that store yet; consumers render the badge inert.
    play_store_link: 'https://play.google.com/store/apps/details?id=in.plantathome.app',
    app_store_link: '',
  },
  headerLinks: [
    { href: Routes.trackOrder, icon: null, label: 'Track Order' },
    { href: Routes.coupons, icon: null, label: 'nav-menu-offer' },
    { href: Routes.flashSale, label: 'nav-menu-flash-sale' },
    { href: Routes.help, label: 'nav-menu-faq' },
    { href: Routes.contactUs, label: 'nav-menu-contact' },
    { href: Routes.customerRefundPolicies, label: 'nav-menu-refund-policy' },
  ],
  footer: {
    // copyright: {
    //   name: 'RedQ, Inc',
    //   href: 'https://redq.io/',
    // },
    // address: '2429 River Drive, Suite 35 Cottonhall, CA 2296 United Kingdom',
    // email: 'dummy@dummy.com',
    // phone: '+1 256-698-0694',
    menus: [
      {
        title: 'text-explore',
        links: [
          {
            name: 'Shop Plants',
            href: '/categories',
          },
          {
            name: 'Flash Deals',
            href: Routes?.flashSale,
          },
          {
            name: 'Coupons & Offers',
            href: Routes.coupons,
          },
        ],
      },
      {
        title: 'text-customer-service',
        links: [
          {
            name: 'Help & FAQ',
            href: Routes.help,
          },
          {
            name: 'Refund Policy',
            href: Routes.customerRefundPolicies,
          },
          {
            name: 'Track Your Order',
            href: Routes.orders,
          },
        ],
      },
      {
        title: 'text-our-information',
        links: [
          {
            name: 'Privacy Policy',
            href: Routes.privacy,
          },
          {
            name: 'Terms & Conditions',
            href: Routes.terms,
          },
          {
            name: 'Contact Us',
            href: Routes.contactUs,
          },
        ],
      },
    ],
    // payment_methods: [
    //   {
    //     img: '/payment/master.png',
    //     url: '/',
    //   },
    //   {
    //     img: '/payment/skrill.png',
    //     url: '/',
    //   },
    //   {
    //     img: '/payment/paypal.png',
    //     url: '/',
    //   },
    //   {
    //     img: '/payment/visa.png',
    //     url: '/',
    //   },
    //   {
    //     img: '/payment/discover.png',
    //     url: '/',
    //   },
    // ],
  },
};
