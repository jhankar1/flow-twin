import type { FastifyPluginAsync } from 'fastify';

const CATEGORIES = [
  {
    value: 'Customer',
    label: 'Customer Process',
    description: 'Customer-facing flows: bookings, payments, onboarding, OTP, documents.',
    color: '#f97316',
    iconName: 'ShoppingCart',
    lotPrefix: 'CUST',
  },
  {
    value: 'Business',
    label: 'Business Process',
    description: 'Internal operations: approvals, HR, e-signatures, SLA management.',
    color: '#ef4444',
    iconName: 'Briefcase',
    lotPrefix: 'BIZ',
  },
  {
    value: 'Industrial',
    label: 'Industrial Process',
    description: 'IIoT-driven factory flows: sensor monitoring, QA checks, actuator control.',
    color: '#14b8a6',
    iconName: 'Factory',
    lotPrefix: 'IND',
  },
];

const processCategoriesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/process-categories',
    { onRequest: [fastify.verifyJwt] },
    async () => CATEGORIES,
  );
};

export default processCategoriesRoute;
