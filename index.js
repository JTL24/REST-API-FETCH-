const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8000;

app.use(bodyParser.json());
// Starts server 
app.listen(port, () => {
    console.log('Server is running on port'); 
})
// List to keep track of transactions
const transactions = [];
// Object to keep track of payer balances
const payerBalances = {};

// Endpoints to add points for a payer 
app.post('/add', (req, res) => {
    const { payer, points, timestamp } = req.body;
  
    if (!payer || !points || !timestamp) {
      return res.status(400).end();
    }
    
    transactions.push(req.body);
    // Updating the payer's balance (or initializing if payer doesn't exist)
    payerBalances[payer] = (payerBalances[payer] || 0) + points;
  
    res.status(200).end();
  });

// Endpoint to spend points
app.post('/spend', (req, res) => {
    const { points } = req.body;
  
    // Checking if the number of points to spend is valid and available
    if (!points || points > transactions.reduce((sum, t) => sum + t.points, 0)) {
      return res.status(400).send('The User doesn’t have enough points');
    }
  
    const spentPoints = [];
    // Sorting transactions based on their timestamp (oldest first)
    const sortedTransactions = transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
    let pointsToDeduct = points;
    // Looping through each transaction to deduct points
    for (const transaction of sortedTransactions) {
        // Deduct the minimum between points left to deduct and points in the current transaction
        const deduct = Math.min(pointsToDeduct, transaction.points);
  
        // Updating the transaction's points and payer's balance
        transaction.points -= deduct;
        payerBalances[transaction.payer] -= deduct;
        
        // Decrementing 
        pointsToDeduct -= deduct;
  
        // Keeping track of how many points were deducted from each payer
        const existingPayer = spentPoints.find(p => p.payer === transaction.payer);
        if (existingPayer) {
          existingPayer.points -= deduct;
        } else {
          spentPoints.push({ payer: transaction.payer, points: -deduct });
        }

        if (pointsToDeduct === 0) break;
      }
  
    res.status(200).json(spentPoints);
  });

// Endpoint to fetch the balance of each player 
app.get('/balance', (req, res) => {
    res.status(200).json(payerBalances);
});
  