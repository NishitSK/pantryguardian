const express = require('express');
const { prisma } = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all storage methods
// TODO: Add verifyToken back after implementing JWT auth on frontend
router.get('/', async (req, res) => {
  try {
    const storageMethods = await prisma.storageMethod.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(storageMethods);
  } catch (error) {
    console.error('Get storage methods error:', error);
    res.status(500).json({ error: 'Failed to fetch storage methods' });
  }
});

module.exports = router;
