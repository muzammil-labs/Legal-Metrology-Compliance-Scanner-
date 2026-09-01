import os
import hashlib
from datetime import datetime, timedelta
from database import engine, Base, SessionLocal
from models import InspectionRecord

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(InspectionRecord).count()
    if existing >= 25:
        print(f"Database already contains {existing} records. Seeding skipped.")
        db.close()
        return

    regions = [
        ("North Delhi — Model Town", "28.7159° N, 77.1910° E"),
        ("South Mumbai — Colaba Market", "18.9067° N, 72.8147° E"),
        ("Bengaluru Urban — Indiranagar", "12.9784° N, 77.6408° E"),
        ("Kolkata Central — New Market", "22.5601° N, 88.3527° E"),
        ("Chennai South — T. Nagar", "13.0418° N, 80.2341° E"),
    ]

    sample_products = [
        ("Amul Gold Milk 500ml.jpg", "PASS", 100, "Manufactured by Gujarat Co-operative Milk Marketing Federation Ltd, Anand 388001. Net Qty: 500 ml. MRP Rs. 33 (incl. of all taxes). Consumer Care: 1800-258-3333 care@amul.coop. Country of Origin: India. USP Rs. 0.066 / ml"),
        ("Tata Salt 1kg.jpg", "PASS", 100, "Packed by Tata Consumer Products Ltd, Mumbai 400001. Net Qty: 1 kg. MRP Rs. 28 (incl. of all taxes). Date of Mfg: 06/2026. Consumer Care: 1800-345-1720. Country of Origin: India. USP Rs. 28.00 / kg"),
        ("Fortune Mustard Oil 1L.jpg", "PASS", 100, "Manufactured by Adani Wilmar Ltd, Ahmedabad 380009. Net Qty: 1 l. MRP Rs. 165 (incl. of all taxes). FSSAI Lic. No. 10013021000853. Vegetarian. Country of Origin: India. USP Rs. 165.00 / l"),
        ("Britannia Good Day 200g.jpg", "PASS", 100, "Mfg by Britannia Industries Ltd, Kolkata 700017. Net Qty: 200 g. MRP Rs. 40 (incl. of all taxes). Date of Mfg: 05/2026. Consumer Helpline: 1800-425-4449. India. USP Rs. 0.20 / g"),
        ("Aashirvaad Atta 5kg.jpg", "PASS", 100, "Manufactured by ITC Limited, Kolkata 700071. Net Qty: 5 kg. MRP Rs. 245 (incl. of all taxes). Date: 07/2026. Care: 1800-425-4444. Country of Origin: India. USP Rs. 49.00 / kg"),
        ("Dabur Honey 250g.jpg", "PASS", 100, "Mfg by Dabur India Ltd, Ghaziabad 201010. Net Qty: 250 g. MRP Rs. 120 (incl. of all taxes). Pkd: 04/2026. Helpline: 1800-103-1644. Made in India. USP Rs. 0.48 / g"),
        ("Haldirams Bhujia 150g.jpg", "PASS", 100, "Manufactured by Haldiram Snacks Pvt Ltd, Noida 201307. Net Qty: 150 g. MRP Rs. 55 (incl. of all taxes). 08/2026. Toll Free: 1800-102-3344. Origin: India. USP Rs. 0.366 / g"),
        ("Parle-G Biscuits 250g.jpg", "PASS", 100, "Mfg by Parle Products Pvt Ltd, Mumbai 400057. Net Qty: 250 g. MRP Rs. 25 (incl. of all taxes). 06/2026. Helpline: 1800-222-098. India. USP Rs. 0.10 / g"),
        ("Everest Turmeric Powder 100g.jpg", "PASS", 100, "Packed by Everest Spices, Mumbai 400069. Net Qty: 100 g. MRP Rs. 32 (incl. of all taxes). 03/2026. care@everestspices.com. Made in India. USP Rs. 0.32 / g"),
        ("Catch Black Pepper 50g.jpg", "PASS", 100, "Mfg by DS Spiceco Pvt Ltd, Noida 201301. Net Qty: 50 g. MRP Rs. 75 (incl. of all taxes). 05/2026. 1800-103-1313. Country of Origin: India. USP Rs. 1.50 / g"),
        ("Saffola Gold Oil 1L.jpg", "PASS", 100, "Manufactured by Marico Limited, Mumbai 400098. Net Qty: 1 l. MRP Rs. 180 (incl. of all taxes). FSSAI Lic 10012022000258. 1800-222-248. India. USP Rs. 180.00 / l"),
        ("MDH Garam Masala 100g.jpg", "PASS", 100, "Packed by Mahashian Di Hatti Pvt Ltd, New Delhi 110058. Net Qty: 100 g. MRP Rs. 94 (incl. of all taxes). 07/2026. 1800-112-233. Origin: India. USP Rs. 0.94 / g"),
        ("Brooke Bond Red Label 500g.jpg", "PASS", 100, "Manufactured by Hindustan Unilever Ltd, Mumbai 400099. Net Qty: 500 g. MRP Rs. 280 (incl. of all taxes). 06/2026. care@unilever.com. India. USP Rs. 0.56 / g"),
        ("Nescafe Classic 50g.jpg", "PASS", 100, "Manufactured by Nestle India Ltd, New Delhi 110001. Net Qty: 50 g. MRP Rs. 170 (incl. of all taxes). 04/2026. wecare@nestle.in. Made in India. USP Rs. 3.40 / g"),
        ("Kissan Mixed Fruit Jam 500g.jpg", "PASS", 100, "Packed by Hindustan Unilever Ltd, Mumbai 400099. Net Qty: 500 g. MRP Rs. 175 (incl. of all taxes). FSSAI Lic 10013022000249. India. USP Rs. 0.35 / g"),
        ("Maggi 2-Minute Noodles 280g.jpg", "PASS", 100, "Mfg by Nestle India Ltd, Gurgaon 122002. Net Qty: 280 g. MRP Rs. 56 (incl. of all taxes). 07/2026. care@nestle.in. Made in India. USP Rs. 0.20 / g"),
        ("Sunfeast Dark Fantasy 300g.jpg", "PASS", 100, "Mfg by ITC Ltd, Bengaluru 560001. Net Qty: 300 g. MRP Rs. 120 (incl. of all taxes). 06/2026. care@itc.in. Origin: India. USP Rs. 0.40 / g"),
        ("Lipton Green Tea 100 Bags.jpg", "PASS", 100, "Packed by HUL, Mumbai 400099. Net Qty: 200 g. MRP Rs. 450 (incl. of all taxes). 05/2026. lever.care@unilever.com. India. USP Rs. 2.25 / g"),
        ("Local Chips 50gm NoTax.jpg", "FAIL", 50, "Packed by Sunrise Food Products, Industrial Area. Net Qty: 50 gm. MRP Rs. 20/-. No consumer helpline."),
        ("Regional Biscuit NonSI.jpg", "FAIL", 60, "Manufactured by Desi Bakery 110006. Net Qty: 400 gms. MRP Rs. 60. Imported without country of origin."),
        ("Imported Candy NoOrigin.jpg", "FAIL", 45, "Packed by Sweet Imports Ltd 400001. Net Qty: 100 g. MRP Rs. 150 (incl. of all taxes). No country of origin listed."),
        ("Spices Pack MissingCare.jpg", "FAIL", 65, "Mfg by Masala Mill 700001. Country of Origin: India. Net Qty: 200 g. MRP Rs. 90 (incl. of all taxes)."),
        ("Snack Box MisleadingUSP.jpg", "FAIL", 55, "Packed by QuickSnacks Ltd, PIN: 560001. Net Qty: 500 g. MRP Rs. 200 (incl. of all taxes). USP Rs. 1.50 / g (Invalid Calculation). Country: India."),
        ("Flour 1000gm NonSI.jpg", "FAIL", 70, "Packed by Grain Foods 110092. Net Wt 1000 gm. MRP Rs. 85 (incl. of all taxes). 05/2026. care@grain.com. India."),
        ("Local Oil MissingPIN.jpg", "WARNING", 80, "Manufactured by Pure Oils, Industrial Estate. Net Qty: 1 l. MRP Rs. 140 (incl. of all taxes). 06/2026. Care: 1800-000-111. India. USP Rs. 140 / l"),
        ("Pickle MissingTaxSuffix.jpg", "FAIL", 60, "Mfg by Taste Pickles Ltd, PIN 800001. Net Qty: 400 g. MRP Rs. 110. Date: 04/2026. Help: 1800-222-333. India."),
        ("Juice NonMetricSymbols.jpg", "FAIL", 55, "Packed by Fresh Beverage Ltd 500001. Net Qty: 200 ml. MRP Rs. 30. Origin: India. No tax statement."),
        ("Detergent MissingAddress.jpg", "FAIL", 50, "Net Qty: 1 kg. MRP Rs. 120 (incl. of all taxes). Made in India. Consumer care: care@clean.com"),
        ("Sauce Bottle InvalidUSP.jpg", "FAIL", 60, "Manufactured by Spice King Ltd, PIN 600001. Net Qty: 1 kg. MRP Rs. 150 (incl. of all taxes). India. USP Rs. 50 / kg (Mathematical Error)."),
        ("Wafer Pack MissingDate.jpg", "FAIL", 70, "Mfg by Crunch Wafers Ltd, PIN 411001. Net Qty: 100 g. MRP Rs. 30 (incl. of all taxes). India. Care: 1800-111-999. USP Rs. 0.30 / g.")
    ]

    for i, (fn, status, trust, text) in enumerate(sample_products):
        reg, gps = regions[i % len(regions)]
        record_date = datetime.utcnow() - timedelta(days=(30 - i))
        sha = hashlib.sha256(f"{fn}_{i}_{record_date.isoformat()}".encode()).hexdigest()
        
        record = InspectionRecord(
            source_filename=fn,
            sha256_hash=sha,
            region=reg,
            gps_location=gps,
            trust_score=trust,
            overall_status=status,
            extracted_text=text,
            inspected_at=record_date
        )
        db.add(record)

    db.commit()
    count = db.query(InspectionRecord).count()
    print(f"Successfully seeded database with {count} inspection records.")
    db.close()

if __name__ == "__main__":
    seed()
