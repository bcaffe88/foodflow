  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "kitchen_accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]).default("pending").notNull(),
  source: varchar("source", { length: 50 }).default("website").notNull(), // website, ifood, ubereats, etc
  externalOrderId: varchar("externalOrderId", { length: 255 }), // ID do pedido na plataforma externa
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripePixQrCode: text("stripePixQrCode"),
  stripePixCopyPaste: text("stripePixCopyPaste"),
  driverId: int("driverId"), // References users (delivery_driver role)
  assignedAt: timestamp("assignedAt"),