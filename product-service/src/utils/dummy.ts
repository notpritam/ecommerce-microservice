import Product, { IProduct } from "../models/product.model";

export async function generateDemoProducts(
  count: number,
  imageUrls: string[]
): Promise<IProduct[]> {
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Beauty",
    "Books",
    "Sports",
    "Toys",
    "Jewelry",
    "Furniture",
    "Automotive",
  ];

  const tags = [
    "new",
    "bestseller",
    "sale",
    "limited",
    "eco-friendly",
    "handmade",
    "exclusive",
    "trending",
    "premium",
    "gift",
  ];

  const adjectives = [
    "Premium",
    "Luxury",
    "Essential",
    "Modern",
    "Classic",
    "Professional",
    "Elegant",
    "Sleek",
    "Compact",
    "Vintage",
  ];

  const productTypes = {
    Electronics: [
      "Smartphone",
      "Laptop",
      "Headphones",
      "Tablet",
      "Camera",
      "Smartwatch",
      "Speaker",
      "TV",
      "Gaming Console",
      "Drone",
    ],
    Clothing: [
      "T-Shirt",
      "Jeans",
      "Dress",
      "Jacket",
      "Sweater",
      "Hoodie",
      "Shorts",
      "Skirt",
      "Socks",
      "Hat",
    ],
    "Home & Kitchen": [
      "Blender",
      "Coffee Maker",
      "Toaster",
      "Cookware Set",
      "Knife Set",
      "Dining Set",
      "Bedding Set",
      "Throw Pillow",
      "Lamp",
      "Storage Basket",
    ],
    Beauty: [
      "Facial Cleanser",
      "Moisturizer",
      "Serum",
      "Makeup Palette",
      "Lipstick",
      "Perfume",
      "Shampoo",
      "Face Mask",
      "Nail Polish",
      "Hair Dryer",
    ],
    Books: [
      "Novel",
      "Cookbook",
      "Self-Help Book",
      "Biography",
      "Fantasy Book",
      "Science Fiction Book",
      "History Book",
      "Children's Book",
      "Art Book",
      "Business Book",
    ],
    Sports: [
      "Yoga Mat",
      "Dumbbell Set",
      "Running Shoes",
      "Basketball",
      "Tennis Racket",
      "Bicycle",
      "Fitness Tracker",
      "Gym Bag",
      "Water Bottle",
      "Hiking Backpack",
    ],
    Toys: [
      "Action Figure",
      "Board Game",
      "Puzzle",
      "Stuffed Animal",
      "Building Blocks",
      "Remote Control Car",
      "Doll",
      "Art Set",
      "Science Kit",
      "Play Kitchen",
    ],
    Jewelry: [
      "Necklace",
      "Earrings",
      "Bracelet",
      "Ring",
      "Watch",
      "Anklet",
      "Pendant",
      "Cufflinks",
      "Brooch",
      "Tiara",
    ],
    Furniture: [
      "Sofa",
      "Dining Table",
      "Bed Frame",
      "Bookshelf",
      "Coffee Table",
      "Desk",
      "Nightstand",
      "Armchair",
      "Dresser",
      "TV Stand",
    ],
    Automotive: [
      "Car Cover",
      "Seat Cushion",
      "Air Freshener",
      "Phone Mount",
      "Dash Cam",
      "Tire Inflator",
      "Floor Mats",
      "Car Wax",
      "Tool Kit",
      "Jump Starter",
    ],
  };

  const descriptions = [
    "This high-quality product is designed to meet all your needs with its durable construction and elegant design.",
    "Experience superior performance with this innovative product, featuring cutting-edge technology and premium materials.",
    "A must-have addition to your collection, offering exceptional value and versatility for everyday use.",
    "Crafted with precision and attention to detail, this product combines style and functionality in perfect harmony.",
    "Elevate your lifestyle with this premium product, designed for those who appreciate quality and sophistication.",
    "This versatile product adapts to your needs, providing reliable performance and long-lasting durability.",
    "Discover the perfect blend of form and function with this thoughtfully designed product, made to enhance your experience.",
    "Featuring an ergonomic design and premium materials, this product delivers comfort and performance in equal measure.",
    "This exclusive product offers unparalleled quality and attention to detail, setting a new standard in its category.",
    "A perfect combination of innovation and tradition, this product will exceed your expectations in every way.",
  ];

  const createdProducts: IProduct[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];

    const productType =
      productTypes[category as keyof typeof productTypes][
        Math.floor(
          Math.random() *
            productTypes[category as keyof typeof productTypes].length
        )
      ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const name = `${adjective} ${productType}`;

    const selectedTags: string[] = [];
    const tagCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)] as string;
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }

    const selectedImages: string[] = [];
    const imageCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < imageCount; j++) {
      const image = imageUrls[
        Math.floor(Math.random() * imageUrls.length)
      ] as string;
      if (!selectedImages.includes(image)) {
        selectedImages.push(image);
      }
    }

    const price = parseFloat((Math.random() * 990 + 9.99).toFixed(2));

    const inStock = Math.random() < 0.8;

    const description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    const product = new Product({
      name,
      description,
      price,
      categories: [category],
      tags: selectedTags,
      inStock,
      images: selectedImages,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)
      ),
    });

    // Save the product
    const savedProduct = await product.save();
    createdProducts.push(savedProduct);
  }

  return createdProducts;
}

export async function populateDatabaseWithDemoProducts() {
  try {
    const imageUrls = ["https://prd.place/400"];

    const products = await generateDemoProducts(50, imageUrls);

    console.log(`Successfully created ${products.length} demo products`);
  } catch (error) {
    console.error("Error generating demo products:", error);
  }
}
