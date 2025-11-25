import axios from 'axios';

async function testFoodFlow() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('\n📦 TESTE FOODFLOW PIZZARIA - WHATSAPP + N8N + SUPABASE\n');
  console.log('=' .repeat(70));

  try {
    // Get restaurants
    console.log('\n[1] Obter restaurantes...\n');
    const restaurantsRes = await axios.get(`${baseUrl}/api/storefront/restaurants`);
    const restaurants = restaurantsRes.data;
    
    console.log(`✅ ${restaurants.length} restaurantes:`);
    restaurants.forEach((r: any) => {
      console.log(`   📍 ${r.name} (ID: ${r.id}, Slug: ${r.slug})`);
    });

    if (restaurants.length === 0) {
      console.log('\n❌ Nenhum restaurante!');
      return;
    }

    const restaurant = restaurants[0];
    console.log(`\n→ Usando: ${restaurant.name}`);

    // Get products
    console.log('\n[2] Obter cardápio...\n');
    const productsRes = await axios.get(`${baseUrl}/api/storefront/${restaurant.slug}/products`);
    console.log(`✅ ${productsRes.data.length} produtos:`);
    productsRes.data.slice(0, 3).forEach((p: any) => {
      console.log(`   🍕 ${p.name} - R$ ${p.price}`);
    });

    // Test WhatsApp webhook
    console.log('\n[3] Testar WhatsApp webhook...\n');
    
    const msgRes = await axios.post(`${baseUrl}/api/whatsapp/webhook`, {
      phoneNumber: '11999999999',
      tenantId: restaurant.id,
      message: 'Olá! Quero pedir uma pizza para casa'
    });
    
    console.log(`✅ Mensagem processada: ${JSON.stringify(msgRes.data)}`);

    // Test create order
    console.log('\n[4] Criar pedido via WhatsApp...\n');
    
    const orderData = {
      phone_number: '11999999999',
      tenant_id: restaurant.id,
      items: [
        { name: 'Pizza Margherita', quantity: 1, price: 45.00 }
      ],
      address: 'Rua das Flores, 123 - São Paulo'
    };

    const orderRes = await axios.post(`${baseUrl}/api/whatsapp/orders`, orderData);
    console.log(`✅ Pedido: ${JSON.stringify(orderRes.data, null, 2)}`);

    // Test delivery fee
    console.log('\n[5] Calcular taxa de delivery...\n');
    
    const feeRes = await axios.post(`${baseUrl}/api/delivery/calculate-fee`, {
      distance: 2500, // 2.5 km
      baseRate: 5.0
    });
    
    console.log(`✅ Taxa de delivery: R$ ${feeRes.data.fee}`);

    // Test geocoding
    console.log('\n[6] Geocodificar endereço...\n');
    
    const geoRes = await axios.post(`${baseUrl}/api/maps/geocode`, {
      address: 'Av. Paulista, 1000, São Paulo, SP'
    });
    
    if (geoRes.data.latitude) {
      console.log(`✅ Endereço: ${geoRes.data.formatted_address}`);
      console.log(`   GPS: ${geoRes.data.latitude}, ${geoRes.data.longitude}`);
    } else {
      console.log(`⚠️  Geocoding sem API key (fallback)`);
    }

    console.log('\n' + '=' .repeat(70));
    console.log('✅ TESTES CONCLUÍDOS COM SUCESSO!\n');

  } catch (error: any) {
    console.error(`\n❌ ERRO:`, error.response?.data || error.message);
  }
}

testFoodFlow();
