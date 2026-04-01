require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("ENV KEY FOUND:", !!process.env.SNIPCART_SECRET_API_KEY);

app.use(cors());
app.use(express.static(__dirname));

app.get("/api/product-stock", async (req, res) => {
  try {
    const secretKey = process.env.SNIPCART_SECRET_API_KEY;

    if (!secretKey) {
      return res.status(500).json({
        error: "Missing SNIPCART_SECRET_API_KEY in .env"
      });
    }

    const authHeader =
      "Basic " + Buffer.from(secretKey + ":").toString("base64");

    const response = await fetch(
      "https://app.snipcart.com/api/products?userDefinedId=oversized-hoodie",
      {
        headers: {
          Accept: "application/json",
          Authorization: authHeader
        }
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Snipcart API error",
        details: text
      });
    }

    const data = JSON.parse(text);
    const product = data.items?.[0];

    if (!product) {
      return res.status(404).json({
        error: "Product not found in Snipcart"
      });
    }

    const stockBySize = {};

    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        const sizeVar = variant.variation?.find(
          (v) => String(v.name).toLowerCase() === "size"
        );

        if (sizeVar?.option) {
          stockBySize[sizeVar.option] = Number(variant.stock || 0);
        }
      });
    }

    res.json({ stockBySize });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "product.html"));
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});