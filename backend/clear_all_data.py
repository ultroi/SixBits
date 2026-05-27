#!/usr/bin/env python3
"""
clear_all_data.py

Simple one-file utility to list and drop MongoDB collections for this project.

Usage examples:
  # interactive (prompts before deleting)
  python clear_all_data.py

  # non-interactive (drop only specific collections)
  MONGODB_URI='mongodb://user:pass@host:27017/dbname' python clear_all_data.py --only users,timelines

  # skip confirmation
  python clear_all_data.py --yes

Requirements:
  pip install pymongo

Environment:
  MONGODB_URI or MONGO_URI may be set; otherwise it defaults to mongodb://localhost:27017/sixbits

Be careful: this permanently deletes data. Use in dev only unless you know what you're doing.
"""

import os
import argparse
import sys
from urllib.parse import urlparse

try:
    from pymongo import MongoClient
except Exception as e:
    print('Missing dependency: pymongo is required. Install with: pip install pymongo')
    raise


def load_dotenv(path):
    """Simple .env loader: reads KEY=VALUE lines and sets os.environ if not already set."""
    if not os.path.exists(path):
        return {}

    data = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            key, val = line.split('=', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            # Only set if not already in env
            if key not in os.environ:
                os.environ[key] = val
            data[key] = val
    return data


def get_default_db_name_from_uri(uri):
    # If URI contains a path component, use it as DB name; otherwise return None
    try:
        parsed = urlparse(uri)
        path = parsed.path
        if path and len(path) > 1:
            return path.lstrip('/')
    except Exception:
        pass
    return None


def confirm(prompt):
    try:
        ans = input(prompt + ' (yes/no): ').strip().lower()
    except KeyboardInterrupt:
        print('\nAborted')
        sys.exit(1)
    return ans == 'yes'


def main():
    parser = argparse.ArgumentParser(description='Clear MongoDB collections for the SixBits project')
    parser.add_argument('--uri', '-u', help='MongoDB URI (overrides env MONGODB_URI/MONGO_URI)')
    parser.add_argument('--only', help='Comma-separated list of collections to drop (default: all collections)')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--db', help='Database name to use (overrides URI path)')
    args = parser.parse_args()

    # Load .env if present (check backend/.env then repo root .env)
    backend_dotenv = os.path.join(os.path.dirname(__file__), '.env')
    repo_dotenv = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(backend_dotenv)
    load_dotenv(repo_dotenv)

    uri = args.uri or os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/sixbits'
    dbname = args.db or get_default_db_name_from_uri(uri) or 'sixbits'

    print('Connecting to MongoDB URI:', uri)
    print('Using database:', dbname)

    client = MongoClient(uri)
    db = client[dbname]

    available = db.list_collection_names()
    if not available:
        print('No collections found in database:', dbname)

        # Try discovering collections in other databases on the same server
        try:
            all_dbs = client.list_database_names()
        except Exception as e:
            print('Failed to list databases on server:', str(e))
            return

        candidates = []
        for d in all_dbs:
            # Skip internal/system databases
            if d in ('admin', 'local', 'config'):
                continue
            try:
                cols = client[d].list_collection_names()
            except Exception:
                cols = []
            if cols:
                candidates.append((d, cols))

        if candidates:
            print('\nFound collections in other databases on the server:')
            for i, (d, cols) in enumerate(candidates, start=1):
                sample = ', '.join(cols[:10])
                if len(cols) > 10:
                    sample += ', ...'
                print(' {idx}) {dbname}: {count} collections -> {sample}'.format(
                    idx=i, dbname=d, count=len(cols), sample=sample))

            # If script was called with --db but that DB had none, allow picking another
            if args.db:
                print('\nNote: --db was provided but that database contains no collections.')

            if args.yes:
                # Non-interactive: pick the first candidate
                chosen_db = candidates[0][0]
                print('Auto-selecting database:', chosen_db)
                dbname = chosen_db
                db = client[dbname]
                available = db.list_collection_names()
            else:
                try:
                    sel = input('\nSelect database number to use (or type N to abort): ').strip()
                except KeyboardInterrupt:
                    print('\nAborted')
                    return
                if not sel or sel.lower() in ('n', 'no'):
                    print('Aborted by user. No changes made.')
                    return
                try:
                    idx = int(sel) - 1
                    if idx < 0 or idx >= len(candidates):
                        print('Invalid selection. Aborting.')
                        return
                    dbname = candidates[idx][0]
                    db = client[dbname]
                    available = db.list_collection_names()
                except ValueError:
                    print('Invalid selection. Aborting.')
                    return
        else:
            print('No collections found on server in non-system databases. Exiting.')
            return

    if args.only:
        wanted = [c.strip() for c in args.only.split(',') if c.strip()]
        to_drop = [c for c in available if c in wanted]
        missing = [c for c in wanted if c not in available]
        if missing:
            print('Warning: the following requested collections were not found:', ', '.join(missing))
    else:
        to_drop = available

    if not to_drop:
        print('No collections to drop. Exiting.')
        return

    print('\nCollections to be dropped:')
    for c in to_drop:
        print(' -', c)

    if not args.yes:
        ok = confirm('\nThis will PERMANENTLY DROP the above collections in database "{}". Proceed?'.format(dbname))
        if not ok:
            print('Aborted by user. No changes made.')
            return

    # Proceed to drop
    for c in to_drop:
        try:
            db.drop_collection(c)
            print('Dropped collection:', c)
        except Exception as e:
            print('Failed to drop', c, '-', str(e))

    print('\nDone.')


if __name__ == '__main__':
    main()
