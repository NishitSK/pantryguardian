const express = require('express');
const { prisma } = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all feedback for user
// TODO: Add verifyToken back after implementing JWT auth on frontend
router.get('/', async (req, res) => {
  try {
    // Temporary: Use demo user
    const user = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        inventoryItem: {
          userId: user.id
        }
      },
      include: {
        inventoryItem: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Submit feedback
// TODO: Add verifyToken back after implementing JWT auth on frontend
router.post('/', async (req, res) => {
  try {
    const { inventoryItemId, userReportedExpiry, freshnessScore, notes } = req.body;

    if (!inventoryItemId || !userReportedExpiry) {
      return res.status(400).json({ 
        error: 'inventoryItemId and userReportedExpiry are required' 
      });
    }

    if (freshnessScore && (freshnessScore < 1 || freshnessScore > 5)) {
      return res.status(400).json({ 
        error: 'freshnessScore must be between 1 and 5' 
      });
    }

    // Temporary: Use demo user
    const user = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!inventoryItem || inventoryItem.userId !== user.id) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        inventoryItemId,
        userReportedExpiry: new Date(userReportedExpiry),
        freshnessScore: freshnessScore || null,
        notes: notes || null
      },
      include: {
        inventoryItem: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
