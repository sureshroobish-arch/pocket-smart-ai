import { GoogleGenAI, Type } from '@google/genai';
import { PlanResultData, BudgetCategoryBreakdown, RecommendedItem, ShoppingLink } from '../db/schema.ts';

export function buildShoppingLinks(itemName: string): ShoppingLink[] {
  const q = encodeURIComponent(itemName.trim());
  return [
    {
      store: 'Google Shopping',
      url: `https://www.google.com/search?tbm=shop&q=${q}`,
    },
    {
      store: 'Amazon',
      url: `https://www.amazon.in/s?k=${q}`,
    },
    {
      store: 'Flipkart',
      url: `https://www.flipkart.com/search?q=${q}`,
    },
  ];
}

export function enforceBudgetConstraint(
  rawPlan: PlanResultData,
  totalBudget: number
): PlanResultData {
  let adjusted = false;
  const categories: BudgetCategoryBreakdown[] = (rawPlan.budget_breakdown || []).map((cat) => {
    const items: RecommendedItem[] = (cat.items || []).map((it) => {
      const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
      const price = Math.max(50, Math.round(Number(it.estimated_price) || 500));
      return {
        name: it.name || 'Recommended Item',
        category: it.category || cat.category || 'General',
        estimated_price: price,
        quantity: qty,
        reason: it.reason || 'Selected to fit your category allocation and preferences.',
        shopping_links: buildShoppingLinks(it.name || cat.category || 'Home Item'),
      };
    });

    const itemsSubtotal = items.reduce((sum, item) => sum + item.estimated_price * item.quantity, 0);
    const allocated = Math.max(itemsSubtotal, Math.round(Number(cat.allocated_budget) || itemsSubtotal));

    return {
      category: cat.category || 'Category',
      allocated_budget: allocated,
      percentage_of_budget: Math.round((allocated / totalBudget) * 100),
      items,
    };
  });

  let totalAllocated = categories.reduce((sum, c) => sum + c.allocated_budget, 0);
  let totalItemsCost = categories.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0),
    0
  );

  // Target max spend is 96% of totalBudget if AI exceeded totalBudget
  const maxAllowed = totalBudget;
  if (totalAllocated > maxAllowed || totalItemsCost > maxAllowed) {
    adjusted = true;
    const referenceTotal = Math.max(totalAllocated, totalItemsCost, 1);
    const targetTotal = Math.floor(totalBudget * 0.94); // Leave a healthy 6% buffer when scaling down
    const scaleFactor = targetTotal / referenceTotal;

    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const scaledUnit = Math.max(50, Math.floor((item.estimated_price * scaleFactor) / 50) * 50);
        item.estimated_price = scaledUnit;
      });
      const newItemsTotal = cat.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0);
      const scaledAlloc = Math.max(
        newItemsTotal,
        Math.floor((cat.allocated_budget * scaleFactor) / 100) * 100
      );
      cat.allocated_budget = scaledAlloc;
    });
  }

  // Final pass to guarantee sum of category allocations and items never exceed totalBudget
  totalItemsCost = categories.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0),
    0
  );
  totalAllocated = categories.reduce((sum, c) => sum + c.allocated_budget, 0);

  if (totalAllocated > totalBudget) {
    adjusted = true;
    let overflow = totalAllocated - totalBudget;
    for (let i = categories.length - 1; i >= 0 && overflow > 0; i--) {
      const catItemsCost = categories[i].items.reduce(
        (s, it) => s + it.estimated_price * it.quantity,
        0
      );
      const reducible = Math.max(0, categories[i].allocated_budget - catItemsCost);
      const cut = Math.min(reducible, overflow);
      categories[i].allocated_budget -= cut;
      overflow -= cut;
    }
  }

  const finalUsed =
    totalItemsCost > 0 && totalItemsCost <= totalBudget
      ? totalItemsCost
      : Math.min(totalAllocated, totalBudget);

  // Ensure each category allocated_budget reflects at least its items and percentages are accurate
  categories.forEach((cat) => {
    const catItemsSum = cat.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0);
    if (cat.allocated_budget < catItemsSum) {
      cat.allocated_budget = catItemsSum;
    }
    cat.percentage_of_budget = Math.max(1, Math.round((cat.allocated_budget / totalBudget) * 100));
  });

  // Ensure sum of allocated_budget does not exceed totalBudget
  const sumAllocatedAfter = categories.reduce((s, c) => s + c.allocated_budget, 0);
  const budgetUsed = Math.min(totalBudget, Math.max(finalUsed, Math.min(sumAllocatedAfter, totalBudget)));
  const budgetRemaining = Math.max(0, totalBudget - budgetUsed);

  const defaultTips = [
    'Compare prices across Amazon, Flipkart, and Google Shopping before purchasing.',
    'Keep a small emergency or buffer amount for delivery and installation fees.',
    'Prioritize essential items first before committing to decorative upgrades.',
    'Check product ratings, return policies, and manufacturer warranty details.',
  ];

  return {
    title: rawPlan.title || `Smart Plan for ₹${totalBudget.toLocaleString('en-IN')}`,
    summary:
      rawPlan.summary ||
      `A structured budget recommendation tailored to stay safely within your ₹${totalBudget.toLocaleString('en-IN')} limit.`,
    budget_used: budgetUsed,
    budget_remaining: budgetRemaining,
    budget_breakdown: categories,
    tips: Array.isArray(rawPlan.tips) && rawPlan.tips.length > 0 ? rawPlan.tips : defaultTips,
    is_fallback: rawPlan.is_fallback || false,
    budget_adjusted: adjusted,
  };
}

export function generateDeterministicFallbackPlan(
  planType: string,
  totalBudget: number,
  requestData: Record<string, any>
): PlanResultData {
  const type = planType.toLowerCase();

  if (type === 'home') {
    const room = requestData.room || 'Living Room';
    const style = requestData.style || 'Modern';
    const priority = requestData.priority || 'Balanced';

    const furnitureAlloc = Math.round(totalBudget * 0.35);
    const decorAlloc = Math.round(totalBudget * 0.20);
    const diningAlloc = Math.round(totalBudget * 0.18);
    const lightingAlloc = Math.round(totalBudget * 0.15);
    const fansAlloc = totalBudget - (furnitureAlloc + decorAlloc + diningAlloc + lightingAlloc); // 12%

    const sofaPrice = Math.round(furnitureAlloc * 0.68);
    const tablePrice = Math.round(furnitureAlloc * 0.25);
    const lightUnit = Math.max(250, Math.round((lightingAlloc * 0.45) / 2));
    const lampPrice = Math.round(lightingAlloc * 0.42);
    const fanUnit = Math.max(800, Math.round((fansAlloc * 0.9) / 2));
    const diningSetPrice = Math.round(diningAlloc * 0.88);
    const rugPrice = Math.round(decorAlloc * 0.45);
    const curtainsPrice = Math.round(decorAlloc * 0.40);

    const breakdown: BudgetCategoryBreakdown[] = [
      {
        category: 'Furniture',
        allocated_budget: furnitureAlloc,
        percentage_of_budget: 35,
        items: [
          {
            name: `${style} ${room} Primary Seating / Storage Unit`,
            category: 'Furniture',
            estimated_price: sofaPrice,
            quantity: 1,
            reason: `Core ${priority.toLowerCase()}-grade centerpiece for your ${room.toLowerCase()} in ${style.toLowerCase()} finish.`,
            shopping_links: buildShoppingLinks(`${style} ${room} Sofa Set Furniture`),
          },
          {
            name: `Engineered Wood Accent & Utility Table`,
            category: 'Furniture',
            estimated_price: tablePrice,
            quantity: 1,
            reason: `Complements the ${room.toLowerCase()} layout while keeping furniture spend within the 35% allocation.`,
            shopping_links: buildShoppingLinks(`${style} Wood Coffee Center Table`),
          },
        ],
      },
      {
        category: 'Lighting',
        allocated_budget: lightingAlloc,
        percentage_of_budget: 15,
        items: [
          {
            name: 'Warm-White LED Ceiling Panel Light',
            category: 'Lighting',
            estimated_price: lightUnit,
            quantity: 2,
            reason: `Suitable for a ${style.toLowerCase()} ${room.toLowerCase()} and fits within the 15% lighting allocation.`,
            shopping_links: buildShoppingLinks('Warm White LED Ceiling Light'),
          },
          {
            name: `${style} Ambient Floor / Wall Sconce Lamp`,
            category: 'Lighting',
            estimated_price: lampPrice,
            quantity: 1,
            reason: 'Adds layered ambient illumination with energy-efficient LED optics.',
            shopping_links: buildShoppingLinks(`${style} Standing Floor Lamp LED`),
          },
        ],
      },
      {
        category: 'Fans',
        allocated_budget: fansAlloc,
        percentage_of_budget: 12,
        items: [
          {
            name: 'BLDC Energy-Saving 1200mm Ceiling Fan',
            category: 'Fans',
            estimated_price: fanUnit,
            quantity: 2,
            reason: 'High air delivery with 5-star BEE efficiency rating within the 12% fan allocation.',
            shopping_links: buildShoppingLinks('BLDC Energy Saving Ceiling Fan 1200mm'),
          },
        ],
      },
      {
        category: 'Dining',
        allocated_budget: diningAlloc,
        percentage_of_budget: 18,
        items: [
          {
            name: 'Compact 4-Seater Dining Table & Chair Set',
            category: 'Dining',
            estimated_price: diningSetPrice,
            quantity: 1,
            reason: `Space-saving ${style.toLowerCase()} dining setup matched to the 18% dining allocation.`,
            shopping_links: buildShoppingLinks('4 Seater Wooden Dining Table Set'),
          },
        ],
      },
      {
        category: 'Decor & Essentials',
        allocated_budget: decorAlloc,
        percentage_of_budget: 20,
        items: [
          {
            name: 'Handwoven Cotton Area Rug (5x7 ft)',
            category: 'Decor & Essentials',
            estimated_price: rugPrice,
            quantity: 1,
            reason: 'Anchors the room acoustics and visual warmth within the 20% decor allocation.',
            shopping_links: buildShoppingLinks('Handwoven Cotton Area Rug 5x7'),
          },
          {
            name: 'Blackout Window Curtain Pair & Organizer Set',
            category: 'Decor & Essentials',
            estimated_price: curtainsPrice,
            quantity: 1,
            reason: 'Provides thermal insulation and completes the room essentials.',
            shopping_links: buildShoppingLinks('Room Darkening Window Curtains Set of 2'),
          },
        ],
      },
    ];

    const used = breakdown.reduce(
      (sum, c) => sum + c.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0),
      0
    );

    return {
      title: `Smart ${room} Plan for ₹${totalBudget.toLocaleString('en-IN')}`,
      summary: `A balanced ${style.toLowerCase()} home budget plan for your ${room.toLowerCase()} (${requestData.homeType || 'Apartment'}) using standard category allocations (35% Furniture, 20% Decor & Essentials, 18% Dining, 15% Lighting, 12% Fans).`,
      budget_used: used,
      budget_remaining: Math.max(0, totalBudget - used),
      budget_breakdown: breakdown,
      tips: [
        'Compare prices across Amazon, Flipkart, and local furniture studios before checkout.',
        'Keep the remaining buffer amount for delivery, carpentry assembly, and electrical installation.',
        'Prioritize core furniture and BLDC fans first before ordering soft furnishings.',
        'Verify warranty coverage on BLDC fan motors (minimum 3 years) and LED drivers.',
      ],
      is_fallback: true,
    };
  }

  if (type === 'party') {
    const partyType = requestData.partyType || 'Birthday';
    const guests = Math.max(5, Number(requestData.guests) || 30);
    const foodPref = requestData.foodPreference || 'Vegetarian & Snacks';

    const venueAlloc = Math.round(totalBudget * 0.25);
    const foodAlloc = Math.round(totalBudget * 0.35);
    const decorAlloc = Math.round(totalBudget * 0.15);
    const entAlloc = Math.round(totalBudget * 0.15);
    const contingencyAlloc = totalBudget - (venueAlloc + foodAlloc + decorAlloc + entAlloc); // 10%

    const venuePrice = Math.round(venueAlloc * 0.92);
    const perPlatePrice = Math.max(150, Math.floor((foodAlloc * 0.78) / guests));
    const cakeAndDrinksPrice = Math.round(foodAlloc * 0.18);
    const backdropPrice = Math.round(decorAlloc * 0.60);
    const lightingDecorPrice = Math.round(decorAlloc * 0.32);
    const soundSystemPrice = Math.round(entAlloc * 0.88);
    const disposableKitPrice = Math.round(contingencyAlloc * 0.50);

    const breakdown: BudgetCategoryBreakdown[] = [
      {
        category: 'Venue',
        allocated_budget: venueAlloc,
        percentage_of_budget: 25,
        items: [
          {
            name: `${requestData.location || 'Banquet / Community Lounge'} Booking & Seating Setup`,
            category: 'Venue',
            estimated_price: venuePrice,
            quantity: 1,
            reason: `Allocated 25% of budget for a comfortable venue accommodating ${guests} guests.`,
            shopping_links: buildShoppingLinks('Folding Banquet Event Chairs Tables Rental Kit'),
          },
        ],
      },
      {
        category: 'Food & Drinks',
        allocated_budget: foodAlloc,
        percentage_of_budget: 35,
        items: [
          {
            name: `${foodPref} Catering Platter (Per Guest)`,
            category: 'Food & Drinks',
            estimated_price: perPlatePrice,
            quantity: guests,
            reason: `Covers starters, main course, and dessert for ${guests} guests within the 35% food allocation.`,
            shopping_links: buildShoppingLinks('Party Buffet Chafing Dish Serving Set'),
          },
          {
            name: `Celebration Cake & Welcome Mocktail Bar Pack`,
            category: 'Food & Drinks',
            estimated_price: cakeAndDrinksPrice,
            quantity: 1,
            reason: `Essential centerpiece cake and welcome refreshments for a ${partyType.toLowerCase()}.`,
            shopping_links: buildShoppingLinks('Party Beverage Dispenser Glass Mocktail Set'),
          },
        ],
      },
      {
        category: 'Decorations',
        allocated_budget: decorAlloc,
        percentage_of_budget: 15,
        items: [
          {
            name: `${partyType} Theme Backdrop Arch & Floral Kit`,
            category: 'Decorations',
            estimated_price: backdropPrice,
            quantity: 1,
            reason: `Matches your ${requestData.decorationPreference || 'festive'} decoration preference within the 15% cap.`,
            shopping_links: buildShoppingLinks(`${partyType} Decoration Backdrop Balloon Arch Kit`),
          },
          {
            name: 'Warm Fairy String Lights & Table Centerpieces',
            category: 'Decorations',
            estimated_price: lightingDecorPrice,
            quantity: 1,
            reason: 'Creates warm photography-friendly lighting across the venue.',
            shopping_links: buildShoppingLinks('Warm White LED Fairy Curtain String Lights'),
          },
        ],
      },
      {
        category: 'Entertainment',
        allocated_budget: entAlloc,
        percentage_of_budget: 15,
        items: [
          {
            name: `${requestData.entertainmentPreference || 'Portable Party PA Speaker & Wireless Mic'} Setup`,
            category: 'Entertainment',
            estimated_price: soundSystemPrice,
            quantity: 1,
            reason: 'Delivers clear music, announcements, and interactive games within the 15% entertainment share.',
            shopping_links: buildShoppingLinks('Bluetooth Party Speaker with Wireless Microphone'),
          },
        ],
      },
      {
        category: 'Contingency',
        allocated_budget: contingencyAlloc,
        percentage_of_budget: 10,
        items: [
          {
            name: 'Eco-Friendly Tableware, Napkins & Return Gift Pouches',
            category: 'Contingency',
            estimated_price: disposableKitPrice,
            quantity: 1,
            reason: 'Uses half of the 10% contingency allocation while leaving the rest as an emergency buffer.',
            shopping_links: buildShoppingLinks('Biodegradable Party Plates Cups Napkins Set'),
          },
        ],
      },
    ];

    const used = breakdown.reduce(
      (sum, c) => sum + c.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0),
      0
    );

    return {
      title: `Smart ${partyType} Plan for ₹${totalBudget.toLocaleString('en-IN')}`,
      summary: `Complete ${partyType.toLowerCase()} plan for ${guests} guests using structured event allocations (35% Food & Drinks, 25% Venue, 15% Decorations, 15% Entertainment, 10% Contingency).`,
      budget_used: used,
      budget_remaining: Math.max(0, totalBudget - used),
      budget_breakdown: breakdown,
      tips: [
        'Confirm final guest headcount 48 hours early to avoid paying for unused catering plates.',
        'Order decoration kits and lights online 5 days ahead instead of paying last-minute retail markups.',
        'Keep the 10% contingency reserve untouched until event day for extra ice, transport, or tips.',
        'Compare bulk beverage and tableware packs on Amazon and Flipkart.',
      ],
      is_fallback: true,
    };
  }

  // Default: Jewelry Fallback
  const metal = requestData.metal || 'Gold';
  const style = requestData.style || 'Traditional';
  const occasion = requestData.occasion || 'Wedding / Festive';
  const mainPieceName = requestData.mainPiece || requestData.jewelryType || 'Necklace';

  const mainAlloc = Math.round(totalBudget * 0.55);
  const matchingAlloc = Math.round(totalBudget * 0.25);
  const careAlloc = Math.round(totalBudget * 0.10);
  const bufferAlloc = totalBudget - (mainAlloc + matchingAlloc + careAlloc); // 10%

  const mainPrice = Math.round(mainAlloc * 0.94);
  const matchingPrice = Math.round(matchingAlloc * 0.92);
  const boxPrice = Math.round(careAlloc * 0.75);
  const bufferPrice = Math.round(bufferAlloc * 0.35);

  const breakdown: BudgetCategoryBreakdown[] = [
    {
      category: 'Main Piece',
      allocated_budget: mainAlloc,
      percentage_of_budget: 55,
      items: [
        {
          name: `Hallmarked ${metal} ${style} ${mainPieceName}`,
          category: 'Main Piece',
          estimated_price: mainPrice,
          quantity: 1,
          reason: `Allocates 55% of total budget to the centerpiece ${style.toLowerCase()} ${metal.toLowerCase()} ${mainPieceName.toLowerCase()} for ${occasion.toLowerCase()}.`,
          shopping_links: buildShoppingLinks(`${metal} ${style} ${mainPieceName} Jewelry`),
        },
      ],
    },
    {
      category: 'Matching Piece',
      allocated_budget: matchingAlloc,
      percentage_of_budget: 25,
      items: [
        {
          name: `Coordinated ${metal} ${style} ${requestData.matchingRequirements || 'Drop Earrings / Bracelet'}`,
          category: 'Matching Piece',
          estimated_price: matchingPrice,
          quantity: 1,
          reason: `Designed to pair seamlessly with your ${mainPieceName.toLowerCase()} within the 25% matching allocation.`,
          shopping_links: buildShoppingLinks(`${metal} ${style} Earrings Bracelet Matching`),
        },
      ],
    },
    {
      category: 'Care & Packaging',
      allocated_budget: careAlloc,
      percentage_of_budget: 10,
      items: [
        {
          name: 'Velvet Lockable Jewelry Organizer Box & Microfiber Polish Kit',
          category: 'Care & Packaging',
          estimated_price: boxPrice,
          quantity: 1,
          reason: 'Prevents tarnishing and protects delicate clasps and stone settings within the 10% care budget.',
          shopping_links: buildShoppingLinks('Luxury Velvet Lockable Jewelry Organizer Box'),
        },
      ],
    },
    {
      category: 'Buffer',
      allocated_budget: bufferAlloc,
      percentage_of_budget: 10,
      items: [
        {
          name: 'BIS Hallmark Verification, Making Charge & GST Reserve',
          category: 'Buffer',
          estimated_price: bufferPrice,
          quantity: 1,
          reason: 'Covers purity certification and minor daily bullion rate fluctuations while preserving cash savings.',
          shopping_links: buildShoppingLinks('Jewelry Ultrasonic Cleaner Polishing Cloth'),
        },
      ],
    },
  ];

  const used = breakdown.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + i.estimated_price * i.quantity, 0),
    0
  );

  return {
    title: `Smart ${metal} Jewelry Plan for ₹${totalBudget.toLocaleString('en-IN')}`,
    summary: `Curated ${style.toLowerCase()} ${metal.toLowerCase()} jewelry combination for ${occasion.toLowerCase()} using disciplined allocation (55% Main Piece, 25% Matching Piece, 10% Care & Packaging, 10% Buffer).`,
    budget_used: used,
    budget_remaining: Math.max(0, totalBudget - used),
    budget_breakdown: breakdown,
    tips: [
      'Always check for BIS 6-digit HUID Hallmark on gold and 925 stamp on sterling silver pieces.',
      'Compare making charges (typically 8%–18%) across certified jewelers before finalizing.',
      'Keep your 10% buffer reserve to cover 3% GST and daily metal rate movements.',
      'Ask for a detailed invoice separating metal weight, stone weight, and making charges.',
    ],
    is_fallback: true,
  };
}

export async function generateSmartPlan(
  planType: string,
  totalBudget: number,
  requestData: Record<string, any>
): Promise<PlanResultData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateDeterministicFallbackPlan(planType, totalBudget, requestData);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are PocketSmart AI, an expert Indian financial & shopping budget planner.
Create a realistic, structured budget recommendation plan in Indian Rupees (₹) for the following user request:

Planner Category: ${planType.toUpperCase()}
Total Maximum Budget: ₹${totalBudget}
User Requirements & Preferences:
${JSON.stringify(requestData, null, 2)}

CRITICAL RULES:
1. The total recommended spending (budget_used) MUST BE LESS THAN OR EQUAL TO ₹${totalBudget} (ideally utilizing 88% to 96% of the budget so the user has a sensible remaining buffer).
2. The sum of all category allocated_budget values MUST NOT exceed ₹${totalBudget}.
3. Within each category, the sum of (estimated_price * quantity) for all items MUST NOT exceed that category's allocated_budget.
4. Provide 4 to 5 well-structured categories in budget_breakdown.
   - If HOME planner: include categories like Furniture, Lighting, Fans, Dining, Decor & Essentials (or tailored to the requested room).
   - If PARTY planner: include categories like Venue, Food & Drinks, Decorations, Entertainment, Contingency.
   - If JEWELRY planner: include categories like Main Piece, Matching Piece, Care & Packaging, Buffer / Making & Taxes.
5. Each category should have 1 to 3 concrete, specific items available in the Indian market with realistic Indian Rupee (₹) prices, exact quantity, and a clear 1-sentence reason explaining why it fits the user's requirements and budget.
6. Provide 4 to 5 actionable Smart Tips tailored to this specific purchase.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Plan title including budget in Indian Rupees, e.g., Smart Home Plan for ₹50,000',
            },
            summary: {
              type: Type.STRING,
              description: '2-sentence clear summary of the generated budget strategy.',
            },
            budget_used: {
              type: Type.NUMBER,
              description: 'Total budget used by all recommended items in INR (must be <= totalBudget).',
            },
            budget_remaining: {
              type: Type.NUMBER,
              description: 'Remaining budget in INR (totalBudget - budget_used).',
            },
            budget_breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  allocated_budget: { type: Type.NUMBER },
                  percentage_of_budget: { type: Type.NUMBER },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING },
                        estimated_price: { type: Type.NUMBER },
                        quantity: { type: Type.NUMBER },
                        reason: { type: Type.STRING },
                      },
                      required: ['name', 'category', 'estimated_price', 'quantity', 'reason'],
                    },
                  },
                },
                required: ['category', 'allocated_budget', 'percentage_of_budget', 'items'],
              },
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'title',
            'summary',
            'budget_used',
            'budget_remaining',
            'budget_breakdown',
            'tips',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return generateDeterministicFallbackPlan(planType, totalBudget, requestData);
    }

    const parsed = JSON.parse(text.trim()) as PlanResultData;
    return enforceBudgetConstraint(parsed, totalBudget);
  } catch (error) {
    console.error('Gemini AI generation error, using deterministic fallback:', error);
    return generateDeterministicFallbackPlan(planType, totalBudget, requestData);
  }
}

export function getSampleDemoPlans() {
  const homeResult = generateDeterministicFallbackPlan('home', 50000, {
    room: 'Living Room',
    homeType: '2BHK Apartment',
    requiredItems: '3-Seater Sofa, LED Ceiling Lights, BLDC Fans, 4-Seater Dining Set, Cotton Rug',
    style: 'Modern',
    priority: 'Balanced',
    additionalRequirements: 'Warm lighting and low-maintenance fabrics',
  });
  homeResult.is_fallback = false;
  homeResult.title = 'Smart Home Plan for ₹50,000';

  const partyResult = generateDeterministicFallbackPlan('party', 30000, {
    partyType: 'Birthday',
    guests: 35,
    location: 'Indoor Terrace Lounge, Bengaluru',
    foodPreference: 'North Indian Vegetarian & Live Chaat Counter',
    decorationPreference: 'Warm Fairy Lights & Pastel Balloon Arch',
    entertainmentPreference: 'Bluetooth Party PA System & Trivia Host',
    date: '2026-10-18',
    additionalRequirements: 'Include Belgian chocolate truffle cake',
  });
  partyResult.is_fallback = false;
  partyResult.title = 'Smart Birthday Party Plan for ₹30,000';

  const jewelryResult = generateDeterministicFallbackPlan('jewelry', 100000, {
    jewelryType: 'Set',
    occasion: 'Family Wedding & Festive Reception',
    metal: 'Gold',
    style: 'Traditional',
    mainPiece: '22K Hallmarked Filigree Choker Necklace',
    matchingRequirements: 'Matching Jhumka Drop Earrings',
    additionalRequirements: 'BIS 916 HUID Hallmarked with low making charges',
  });
  jewelryResult.is_fallback = false;
  jewelryResult.title = 'Smart Gold Jewelry Plan for ₹1,00,000';

  return [
    {
      planType: 'home',
      title: homeResult.title,
      budget: 50000,
      budgetUsed: homeResult.budget_used,
      budgetRemaining: homeResult.budget_remaining,
      requestData: {
        budget: 50000,
        room: 'Living Room',
        homeType: '2BHK Apartment',
        requiredItems: '3-Seater Sofa, LED Ceiling Lights, BLDC Fans, 4-Seater Dining Set, Cotton Rug',
        style: 'Modern',
        priority: 'Balanced',
        additionalRequirements: 'Warm lighting and low-maintenance fabrics',
      },
      resultData: homeResult,
    },
    {
      planType: 'party',
      title: partyResult.title,
      budget: 30000,
      budgetUsed: partyResult.budget_used,
      budgetRemaining: partyResult.budget_remaining,
      requestData: {
        budget: 30000,
        partyType: 'Birthday',
        guests: 35,
        location: 'Indoor Terrace Lounge, Bengaluru',
        foodPreference: 'North Indian Vegetarian & Live Chaat Counter',
        decorationPreference: 'Warm Fairy Lights & Pastel Balloon Arch',
        entertainmentPreference: 'Bluetooth Party PA System & Trivia Host',
        date: '2026-10-18',
        additionalRequirements: 'Include Belgian chocolate truffle cake',
      },
      resultData: partyResult,
    },
    {
      planType: 'jewelry',
      title: jewelryResult.title,
      budget: 100000,
      budgetUsed: jewelryResult.budget_used,
      budgetRemaining: jewelryResult.budget_remaining,
      requestData: {
        budget: 100000,
        jewelryType: 'Set',
        occasion: 'Family Wedding & Festive Reception',
        metal: 'Gold',
        style: 'Traditional',
        mainPiece: '22K Hallmarked Filigree Choker Necklace',
        matchingRequirements: 'Matching Jhumka Drop Earrings',
        additionalRequirements: 'BIS 916 HUID Hallmarked with low making charges',
      },
      resultData: jewelryResult,
    },
  ];
}
