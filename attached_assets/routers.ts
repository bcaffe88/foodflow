import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Register webhooks (must be done in server/_core/index.ts)

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Restaurant public info
  restaurant: router({
    getActive: publicProcedure.query(async () => {
      const restaurant = await db.getActiveRestaurant();
      if (!restaurant) {
        throw new Error("No active restaurant found");
      }
      const settings = await db.getRestaurantSettings(restaurant.id);
      return {
        ...restaurant,
        settings,
      };
    }),

    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const restaurant = await db.getActiveRestaurant();
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      const settings = await db.getRestaurantSettings(restaurant.id);
      return settings;
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          stripePublishableKey: z.string().optional(),
          stripeSecretKey: z.string().optional(),
          businessName: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          deliveryFee: z.number().optional(),
          minimumOrder: z.number().optional(),
          estimatedDeliveryTime: z.string().optional(),
          useOwnDrivers: z.boolean().optional(),
          usePlatformDrivers: z.boolean().optional(),
          allowPickup: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const restaurant = await db.getActiveRestaurant();
        if (!restaurant) {
          throw new Error("Restaurant not found");
        }
        await db.updateRestaurantSettings(restaurant.id, input);
        return { success: true };
      }),
  }),

  // Categories
  categories: router({
    list: publicProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategories(input.restaurantId);
      }),
  }),

  // Products
  products: router({
    list: publicProcedure
      .input(
        z.object({
          restaurantId: z.number(),
          categoryId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getProducts(input.restaurantId, input.categoryId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new Error("Product not found");
        }

        const options = await db.getProductOptions(input.id);
        const optionsWithValues = await Promise.all(
          options.map(async (option) => {
            const values = await db.getProductOptionValues(option.id);
            return {
              ...option,
              values,
            };
          })
        );

        return {
          ...product,
          options: optionsWithValues,
        };
      }),

    create: protectedProcedure
      .input(
        z.object({
          restaurantId: z.number(),
          categoryId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          imageUrl: z.string().optional(),
          isAvailable: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          restaurantId: z.number(),
          categoryId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          imageUrl: z.string().optional(),
          isAvailable: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProduct(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProduct(input.id);
      }),
  }),

  // Orders
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          restaurantId: z.number(),
          customerName: z.string(),
          customerPhone: z.string(),
          customerEmail: z.string().optional(),
          deliveryType: z.enum(["delivery", "pickup"]).default("delivery"),
          deliveryAddress: z.string(),
          deliveryLatitude: z.string().optional(),
          deliveryLongitude: z.string().optional(),
          addressReference: z.string().optional(),
          orderNotes: z.string().optional(),
          paymentMethod: z.enum(["cash", "card", "pix", "online"]),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              totalPrice: z.number(),
              customizations: z.string().optional(),
              specialInstructions: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        // Calculate totals
        const subtotal = input.items.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const restaurant = await db.getActiveRestaurant();
        const settings = restaurant
          ? await db.getRestaurantSettings(restaurant.id)
          : null;
        const deliveryFee = settings?.deliveryFee || 0;
        const total = subtotal + deliveryFee;

        // Generate order number
        const orderNumber = `ORD${Date.now().toString().slice(-8)}`;

        // Create order
        const orderResult = await db.createOrder({
          restaurantId: input.restaurantId,
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          deliveryType: input.deliveryType,
          deliveryAddress: input.deliveryAddress,
          deliveryLatitude: input.deliveryLatitude || null,
          deliveryLongitude: input.deliveryLongitude || null,
          addressReference: input.addressReference || null,
          orderNotes: input.orderNotes || null,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          orderStatus: "pending",
        });

        const orderId = Number(orderResult[0].insertId);

        // Create order items
        for (const item of input.items) {
          await db.createOrderItem({
            orderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizations: item.customizations || null,
            specialInstructions: item.specialInstructions || null,
          });
        }

        return {
          orderId,
          orderNumber,
          total,
        };
      }),

    list: protectedProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrdersByRestaurant(input.restaurantId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new Error("Order not found");
        }
        const items = await db.getOrderItems(input.id);
        return {
          ...order,
          items,
        };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  delivery: router({
    register: publicProcedure
      .input(
        z.object({
          name: z.string(),
          phone: z.string(),
          cpf: z.string(),
          vehicle: z.string(),
          licensePlate: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createDeliveryPerson(input);
      }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDeliveryPersonProfile(ctx.user?.id || 0);
    }),

    getAvailableOrders: protectedProcedure.query(async () => {
      return await db.getAvailableOrdersForDelivery();
    }),

    getActiveDeliveries: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveDeliveries(ctx.user?.id || 0);
    }),

    acceptOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.assignOrderToDelivery(input.orderId, ctx.user?.id || 0);
      }),

    completeDelivery: protectedProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.completeDelivery(input.deliveryId);
      }),
  }),

  developer: router({
    getClients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await db.getRestaurantClients();
    }),

    getCommissionStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await db.getCommissionStats();
    }),

    createClient: protectedProcedure
      .input(
        z.object({
          businessName: z.string(),
          ownerName: z.string(),
          email: z.string().email(),
          phone: z.string(),
          commissionPercentage: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await db.createRestaurantClient(input);
      }),

    updateCommission: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          percentage: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await db.updateClientCommission(
          input.clientId,
          input.percentage
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
