from flask import Flask, jsonify, render_template, Response
from pymongo import MongoClient, DESCENDING
from bson import json_util
import yaml
from pathlib import Path
import logging
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__, static_url_path='')
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Strict configuration paths (must be in the mounted volume)
CONFIG_DIR = Path('/config')
SETTINGS_PATH = CONFIG_DIR / 'settings.yaml'
DEVICES_PATH = CONFIG_DIR / 'devices.yaml'

def load_required_config(path):
    """Load a required config file or fail immediately"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            logger.info(f"Loading config from {path}")
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.critical(f"Missing required config file: {path}")
        raise
    except Exception as e:
        logger.critical(f"Error loading {path}: {str(e)}")
        raise

# Load configurations at startup (will fail fast if missing)
try:
    settings = load_required_config(SETTINGS_PATH)
    mongo_uri = settings['mongodb']['uri']
    db_name = settings['mongodb']['database_name']
    debug_mode = settings.get('flask', {}).get('debug', False)
    logger.info(f"MongoDB configured: {mongo_uri}")
except Exception as e:
    logger.critical("Failed to load application configuration")
    raise

class DataModel:
    def __init__(self, mongo_uri, db_name):
        """Initialize with explicit connection parameters"""
        try:
            self.mongo_client = MongoClient(mongo_uri)
            self.db = self.mongo_client[db_name]
            logger.info("MongoDB connection established")
            self.ensure_indexes()
        except Exception as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise

    def ensure_indexes(self):
        """Create required indexes if they don't exist"""
        for collection in self.db.list_collection_names():
            if 'datetime_-1' not in self.db[collection].index_information():
                self.db[collection].create_index([('datetime', DESCENDING)])
                logger.debug(f"Created datetime index for {collection}")

    def get_latest_data(self, collection_name, limit=1):
        return list(
            self.db[collection_name]
            .find()
            .sort('datetime', DESCENDING)
            .limit(limit)
        )

# Initialize DataModel (will fail if MongoDB is unreachable)
data_model = DataModel(mongo_uri, db_name)

@app.route('/api/devices')
def get_devices():
    """Load devices configuration with sensitive fields filtered out"""
    try:
        devices_data = load_required_config(DEVICES_PATH)
        sensitive_fields = {'host', 'port', 'slave_id', 'register_type', 
                          'data_type', 'scale', 'address'}
        
        filtered_devices = []
        for device in devices_data.get('devices', []):
            # Filter sensitive fields at all nesting levels
            filtered_device = {
                k: v for k, v in device.items() 
                if k not in sensitive_fields
            }
            
            if 'registers' in device:
                filtered_device['registers'] = [
                    {k: v for k, v in reg.items() 
                     if k not in sensitive_fields}
                    for reg in device['registers']
                ]
            
            filtered_devices.append(filtered_device)
        
        return Response(
            json_util.dumps({'devices': filtered_devices}),
            mimetype='application/json'
        )
    except Exception as e:
        logger.error(f"Device config error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/<collection>/<int:limit>')
@app.route('/api/data/<collection>')
def get_data(collection, limit=1):
    """Fetch latest data from MongoDB"""
    try:
        data = data_model.get_latest_data(collection, limit)
        return Response(
            json_util.dumps(data),
            mimetype='application/json'
        )
    except Exception as e:
        logger.error(f"Data fetch error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return render_template('data_view.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)