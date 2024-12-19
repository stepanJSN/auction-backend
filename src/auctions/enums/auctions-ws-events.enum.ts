export enum AuctionsWsIncomingEventsEnum {
  SUBSCRIBE = 'auctions.subscribe',
}

export enum AuctionsWsOutgoingEventsEnum {
  FINISHED = 'auctions.finished',
  CHANGED = 'auctions.changed',
  NEW_BID = 'auctions.newBid',
  SUBSCRIBED = 'auctions.subscribed',
}
