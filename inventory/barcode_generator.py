import barcode
from barcode.writer import ImageWriter
from django.conf import settings
from django.core.files.base import ContentFile
import os
from io import BytesIO
import uuid
import string
import random

class BarcodeGenerator:
    \"\"\"Generate barcodes for LPG Hub inventory items\"\"\"
    
    # Barcode prefixes for different categories
    PREFIX_MAPPING = {
        'cylinder': 'GLP',
        'meter': 'SK',
        'cookstove_ffy': 'FFY',
        'cookstove_kfy': 'KFY',
    }
    
    @staticmethod
    def generate_barcode_number(category, cylinder_type=None):
        \"\"\"
        Generate a unique barcode number based on category and type
        
        Format:
        - Cylinder: GLP + 6 random digits (GLP882291)
        - Meter: SK + 6 random digits (SK882291)
        - Cookstove: FFY/KFY + 5 random digits (FFY99122, KFY88291)
        \"\"\"
        if category == 'cylinder':
            prefix = 'GLP'
            random_part = str(random.randint(100000, 999999))
            return f\"{prefix}{random_part}\"
        
        elif category == 'meter':
            prefix = 'SK'
            random_part = str(random.randint(100000, 999999))
            return f\"{prefix}{random_part}\"
        
        elif category == 'cookstove':
            prefix = 'FFY' if random.choice([True, False]) else 'KFY'
            random_part = str(random.randint(10000, 99999))
            return f\"{prefix}{random_part}\"
        
        else:
            raise ValueError(f\"Unknown category: {category}\")\n    
    @staticmethod
    def generate_barcode_image(barcode_number, format='png'):
        \"\"\"
        Generate barcode image from barcode number
        
        Args:
            barcode_number: The barcode number (e.g., 'GLP882291')
            format: Image format ('png', 'jpg', 'svg')
        
        Returns:
            BytesIO object containing the barcode image
        \"\"\"
        try:
            # Create barcode instance
            barcode_instance = barcode.get('code128', barcode_number, writer=ImageWriter())
            
            # Generate image to BytesIO
            image_io = BytesIO()
            barcode_instance.write(image_io)
            image_io.seek(0)
            
            return image_io
        except Exception as e:\n            raise Exception(f\"Error generating barcode image: {str(e)}\")\n    
    @staticmethod\n    def save_barcode_to_file(barcode_number, media_path=None):\n        \"\"\"\n        Save barcode image to file system\n        \n        Args:\n            barcode_number: The barcode number\n            media_path: Optional custom media path\n        \n        Returns:\n            File path to saved barcode image\n        \"\"\"\n        if media_path is None:\n            media_path = os.path.join(settings.MEDIA_ROOT, 'barcodes')\n        \n        # Create directory if it doesn't exist\n        os.makedirs(media_path, exist_ok=True)\n        \n        try:\n            # Generate barcode\n            barcode_instance = barcode.get('code128', barcode_number, writer=ImageWriter())\n            \n            # Save to file\n            file_path = os.path.join(media_path, barcode_number)\n            barcode_instance.save(file_path)\n            \n            return f\"barcodes/{barcode_number}.png\"\n        except Exception as e:\n            raise Exception(f\"Error saving barcode: {str(e)}\")\n    \n    @staticmethod\n    def generate_qr_code(barcode_number, size=5):\n        \"\"\"\n        Generate QR code for barcode (future enhancement)\n        \n        Args:\n            barcode_number: The barcode number\n            size: QR code size\n        \n        Returns:\n            BytesIO object containing QR code image\n        \"\"\"\n        try:\n            import qrcode\n            qr = qrcode.QRCode(\n                version=1,\n                error_correction=qrcode.constants.ERROR_CORRECT_L,\n                box_size=size,\n                border=4,\n            )\n            qr.add_data(barcode_number)\n            qr.make(fit=True)\n            \n            img = qr.make_image(fill_color=\"black\", back_color=\"white\")\n            \n            image_io = BytesIO()\n            img.save(image_io)\n            image_io.seek(0)\n            \n            return image_io\n        except Exception as e:\n            raise Exception(f\"Error generating QR code: {str(e)}\")\n    \n    @staticmethod\n    def batch_generate_barcodes(category, count=10, cylinder_type=None):\n        \"\"\"\n        Generate multiple barcodes at once\n        \n        Args:\n            category: Item category ('cylinder', 'meter', 'cookstove')\n            count: Number of barcodes to generate\n            cylinder_type: Type of cylinder (for cylinders only)\n        \n        Returns:\n            List of generated barcode numbers\n        \"\"\"\n        barcodes_list = []\n        for _ in range(count):\n            barcode_num = BarcodeGenerator.generate_barcode_number(category, cylinder_type)\n            barcodes_list.append(barcode_num)\n        \n        return barcodes_list\n    \n    @staticmethod\n    def validate_barcode_format(barcode_number):\n        \"\"\"\n        Validate if barcode format is correct\n        \n        Args:\n            barcode_number: The barcode to validate\n        \n        Returns:\n            Tuple (is_valid, category, message)\n        \"\"\"\n        if not barcode_number:\n            return False, None, \"Barcode is empty\"\n        \n        # Check cylinder\n        if barcode_number.startswith('GLP'):\n            if len(barcode_number) == 9 and barcode_number[3:].isdigit():\n                return True, 'cylinder', \"Valid cylinder barcode\"\n            else:\n                return False, 'cylinder', \"Invalid cylinder barcode format. Expected: GLP + 6 digits\"\n        \n        # Check meter\n        elif barcode_number.startswith('SK'):\n            if len(barcode_number) == 8 and barcode_number[2:].isdigit():\n                return True, 'meter', \"Valid meter barcode\"\n            else:\n                return False, 'meter', \"Invalid meter barcode format. Expected: SK + 6 digits\"\n        \n        # Check cookstove\n        elif barcode_number.startswith(('FFY', 'KFY')):\n            if len(barcode_number) == 8 and barcode_number[3:].isdigit():\n                return True, 'cookstove', \"Valid cookstove barcode\"\n            else:\n                return False, 'cookstove', \"Invalid cookstove barcode format. Expected: FFY/KFY + 5 digits\"\n        \n        else:\n            return False, None, \"Unknown barcode prefix. Expected: GLP, SK, FFY, or KFY\"\n"