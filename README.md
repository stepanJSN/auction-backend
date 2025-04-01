# ⚖️Auction backend
![Static Badge](https://img.shields.io/badge/typescript-a?&logo=typescript&color=%23D4FAFF)
![NEST__BADGE](https://img.shields.io/badge/nest-7026b9?&logo=nestjs&color=%23E0234E)
![Static Badge](https://img.shields.io/badge/mysql-a?style=flat&logo=mysql&color=white)
![Static Badge](https://img.shields.io/badge/prisma-a?style=flat&logo=prisma&color=%232D3748)
![Static Badge](https://img.shields.io/badge/docker-a?style=flat&logo=docker&color=black)

It is a web application where users can collect cards with characters from a series collect sets from these cards and get ranking points. The main feature is the ability to buy and sell cards in an auction, and the auction prices are updated in real-time. Another interesting feature is chats between users. Also users have the ability to convert real money to internal and vice versa using Stripe.

## 🎯 Features
**🔑 Authentication & Profile Management**

 - 🔐 Sign up & log in
 - 📝 Update personal information
 - 🗑️ Delete profile

**🃏 Card Management**

 - 📜 View list of cards
 - 🀄 View list of sets
 - 🔍 Get card details
 - 🎴 See collected sets & cards

**💬 Chats**

 - 💬 Messaging

**🏆 Auctions**
 - 🏗️ Create auctions
 - 🔎 View & filter auctions
 - ⏳ See current bid in real time
 - 🎯 Place bids on auctions

**💰 Finances**
 - 💳 Top up & withdraw money via Stripe

**🛡️ Admin Features**
 - 👥 Change user roles
 - ❌ Delete users
 - 🃏 Create new cards & sets
 - 📊 View statistics
 - 💱 Modify commission for money exchange

## 🛠️ TechStack

 - 🌐 TypeScript
 - 🗄️ MySQL
 - ⚙️ Nest
 - 📊 Prisma
 - 🐳 Docker
 - 💳 Stripe
 - 🔌 Socket.io

## 🚀 Getting started
1.  Clone project's repo:  `git clone https://github.com/stepanJSN/auction-backend.git`
2.  Create MySQL database
3.  Create an **.env** file and fill it in according to the example in **.env.example**
4.  Run:  `npm install`
5.  Run `npx prisma migrate dev --name init`
6.  To start the server in the command line (terminal) in the folder, run:  `npm run start:dev`
