#!/usr/bin/env python3
"""Import real Uskršnji turnir 2025 data from Excel into production database."""

import unicodedata
import re
import psycopg2
from datetime import datetime, date
from collections import defaultdict

import os
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")

def generate_slug(name):
    s = name.lower()
    s = unicodedata.normalize('NFD', s)
    s = re.sub(r'[\u0300-\u036f]', '', s)
    s = s.replace('\u0111', 'd')  # đ
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'(^-|-$)+', '', s)
    return s

COMPETITORS = [
    'Vjeko Križanac', 'Josip Krišto', 'Stanislav Mandić',
    'Anto Brnada', 'Luka Buzuk', 'Mario Blaž',
    'Davor Križanac', 'Pero Mišković', 'Zoran Livančić',
    'Lujić Frano', 'Darko Križanac', 'Pero Rajković',
    'Perica Matošević', 'Mato Valjan', 'Danijel Matošević',
    'Ranko Brnada', 'Vlado Ančić', 'Ivica Križanac',
    'Danijel Topalović', 'Mario Marić', 'Lojzo Jakić',
    'Lujić Matej', 'Ivica Šafradin', 'Miroslav Jukić',
]

GROUPS = {
    'A': ['Vjeko Križanac', 'Josip Krišto', 'Stanislav Mandić'],
    'B': ['Anto Brnada', 'Luka Buzuk', 'Mario Blaž'],
    'C': ['Davor Križanac', 'Pero Mišković', 'Zoran Livančić'],
    'D': ['Lujić Frano', 'Darko Križanac', 'Pero Rajković'],
    'E': ['Perica Matošević', 'Mato Valjan', 'Danijel Matošević'],
    'F': ['Ranko Brnada', 'Vlado Ančić', 'Ivica Križanac'],
    'G': ['Danijel Topalović', 'Mario Marić', 'Lojzo Jakić'],
    'H': ['Lujić Matej', 'Ivica Šafradin', 'Miroslav Jukić'],
}

# (home_name, home_score, away_name, away_score)
GROUP_MATCHES = {
    'A': [
        ('Vjeko Križanac', 5, 'Josip Krišto', 0),
        ('Vjeko Križanac', 5, 'Stanislav Mandić', 4),
        ('Josip Krišto', 0, 'Stanislav Mandić', 5),
    ],
    'B': [
        ('Anto Brnada', 5, 'Luka Buzuk', 1),
        ('Anto Brnada', 5, 'Mario Blaž', 2),
        ('Luka Buzuk', 5, 'Mario Blaž', 4),
    ],
    'C': [
        ('Davor Križanac', 5, 'Pero Mišković', 0),
        ('Davor Križanac', 1, 'Zoran Livančić', 5),
        ('Pero Mišković', 0, 'Zoran Livančić', 5),
    ],
    'D': [
        ('Lujić Frano', 5, 'Darko Križanac', 4),
        ('Lujić Frano', 5, 'Pero Rajković', 0),
        ('Darko Križanac', 5, 'Pero Rajković', 4),
    ],
    'E': [
        ('Perica Matošević', 4, 'Mato Valjan', 5),
        ('Perica Matošević', 5, 'Danijel Matošević', 0),
        ('Mato Valjan', 5, 'Danijel Matošević', 3),
    ],
    'F': [
        ('Ranko Brnada', 3, 'Vlado Ančić', 5),
        ('Vlado Ančić', 5, 'Ivica Križanac', 3),
        ('Ranko Brnada', 0, 'Ivica Križanac', 5),
    ],
    'G': [
        ('Danijel Topalović', 3, 'Mario Marić', 5),
        ('Danijel Topalović', 5, 'Lojzo Jakić', 4),
        ('Mario Marić', 5, 'Lojzo Jakić', 0),
    ],
    'H': [
        ('Lujić Matej', 0, 'Ivica Šafradin', 5),
        ('Lujić Matej', 5, 'Miroslav Jukić', 2),
        ('Ivica Šafradin', 5, 'Miroslav Jukić', 0),
    ],
}

RO16_MATCHES = [
    ('Vjeko Križanac', 5, 'Davor Križanac', 0),
    ('Anto Brnada', 5, 'Darko Križanac', 0),
    ('Mato Valjan', 5, 'Danijel Topalović', 1),
    ('Vlado Ančić', 5, 'Lujić Matej', 2),
    ('Stanislav Mandić', 5, 'Zoran Livančić', 0),
    ('Luka Buzuk', 5, 'Lujić Frano', 2),
    ('Perica Matošević', 1, 'Mario Marić', 5),
    ('Ivica Križanac', 1, 'Ivica Šafradin', 5),
]

QF_MATCHES = [
    ('Vjeko Križanac', 2, 'Anto Brnada', 5),
    ('Mato Valjan', 5, 'Vlado Ančić', 1),
    ('Stanislav Mandić', 4, 'Luka Buzuk', 5),
    ('Mario Marić', 0, 'Ivica Šafradin', 5),
]

SF_MATCHES = [
    ('Anto Brnada', 5, 'Mato Valjan', 1),
    ('Luka Buzuk', 0, 'Ivica Šafradin', 5),
]

THIRD_PLACE_MATCHES = [
    ('Mato Valjan', 8, 'Luka Buzuk', 16),
]

FINAL_MATCHES = [
    ('Anto Brnada', 10, 'Ivica Šafradin', 24),
]

# Position tiers for ranking
POSITION_TIERS = {
    1: ['Ivica Šafradin'],
    2: ['Anto Brnada'],
    3: ['Luka Buzuk'],
    4: ['Mato Valjan'],
    # 5-8: QF losers
    5: ['Vjeko Križanac', 'Vlado Ančić', 'Stanislav Mandić', 'Mario Marić'],
    # 9-16: RO16 losers
    9: ['Davor Križanac', 'Darko Križanac', 'Danijel Topalović', 'Lujić Matej',
        'Zoran Livančić', 'Lujić Frano', 'Perica Matošević', 'Ivica Križanac'],
    # 17-24: Group 3rds
    17: ['Josip Krišto', 'Mario Blaž', 'Pero Mišković', 'Pero Rajković',
         'Danijel Matošević', 'Ranko Brnada', 'Lojzo Jakić', 'Miroslav Jukić'],
}

KNOCKOUT_STAGES = [
    ('round_of_16', '1/8 finala', 2, RO16_MATCHES),
    ('quarterfinal', 'Četvrtfinale', 3, QF_MATCHES),
    ('semifinal', 'Polufinale', 4, SF_MATCHES),
    ('third_place', 'Za 3. mjesto', 5, THIRD_PLACE_MATCHES),
    ('final', 'Finale', 5, FINAL_MATCHES),
]


def main():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("=== Starting transaction ===")

        # Step 1: Create/find competitors
        print("\n--- Creating competitors ---")
        comp_ids = {}
        for name in COMPETITORS:
            slug = generate_slug(name)
            cur.execute("SELECT id FROM competitors WHERE slug = %s", (slug,))
            row = cur.fetchone()
            if row:
                comp_ids[name] = row[0]
                print(f"  Found: {name} (id={row[0]})")
            else:
                cur.execute("""
                    INSERT INTO competitors (name, slug, country, "isActive", "totalWins", "totalLosses",
                                            "totalEggsBroken", "totalEggsLost", "createdAt", "updatedAt")
                    VALUES (%s, %s, 'Bosna i Hercegovina', true, 0, 0, 0, 0, NOW(), NOW())
                    RETURNING id
                """, (name, slug))
                new_id = cur.fetchone()[0]
                comp_ids[name] = new_id
                print(f"  Created: {name} (id={new_id})")

        print(f"\nTotal competitors: {len(comp_ids)}")

        # Step 2: Create competition
        print("\n--- Creating competition ---")
        cur.execute("""
            INSERT INTO competitions (name, slug, description, "startDate", "endDate", location,
                                     status, "tournamentType", "eggsPerCompetitor", "numberOfGroups",
                                     "isPublished", "isFeatured", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id
        """, (
            'Uskršnji turnir 2025',
            'uskrsnji-turnir-2025',
            'Tradicionalni uskršnji turnir u tucanju jaja 2025. godine.',
            datetime(2025, 4, 20),
            datetime(2025, 4, 20),
            'Vitez, BiH',
            'completed',
            'group_knockout',
            30,
            8,
            True,
            False,
        ))
        competition_id = cur.fetchone()[0]
        print(f"Competition created: id={competition_id}")

        # Step 3: Create group phase rounds and matches
        print("\n--- Creating group phase ---")
        round_number = 0
        all_matches_data = []  # (home, home_score, away, away_score, round_type, multiplier)

        group_labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        for gi, group_label in enumerate(group_labels):
            group_number = gi + 1
            matches = GROUP_MATCHES[group_label]

            for mi, (home, h_score, away, a_score) in enumerate(matches):
                round_number += 1
                kolo = mi + 1
                round_name = f"Grupa {group_label} - {kolo}. kolo"

                cur.execute("""
                    INSERT INTO rounds ("competitionId", "roundNumber", name, "roundType",
                                       "pointMultiplier", "groupNumber", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, (competition_id, round_number, round_name, 'group', 1, group_number))
                round_id = cur.fetchone()[0]

                result = 'home_win' if h_score > a_score else 'away_win'
                cur.execute("""
                    INSERT INTO matches ("competitionId", "roundId", "homeCompetitorId", "awayCompetitorId",
                                        "homeEggsBroken", "awayEggsBroken", result, status,
                                        "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'completed', NOW(), NOW())
                """, (competition_id, round_id, comp_ids[home], comp_ids[away],
                      h_score, a_score, result))

                all_matches_data.append((home, h_score, away, a_score, 'group', 1))

            print(f"  Group {group_label}: 3 rounds, 3 matches")

        # Step 4: Create knockout phase rounds and matches
        print("\n--- Creating knockout phase ---")
        for round_type, round_name, multiplier, matches in KNOCKOUT_STAGES:
            round_number += 1
            cur.execute("""
                INSERT INTO rounds ("competitionId", "roundNumber", name, "roundType",
                                   "pointMultiplier", "groupNumber", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id
            """, (competition_id, round_number, round_name, round_type, multiplier, None))
            round_id = cur.fetchone()[0]

            for home, h_score, away, a_score in matches:
                result = 'home_win' if h_score > a_score else 'away_win'
                cur.execute("""
                    INSERT INTO matches ("competitionId", "roundId", "homeCompetitorId", "awayCompetitorId",
                                        "homeEggsBroken", "awayEggsBroken", result, status,
                                        "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'completed', NOW(), NOW())
                """, (competition_id, round_id, comp_ids[home], comp_ids[away],
                      h_score, a_score, result))

                all_matches_data.append((home, h_score, away, a_score, round_type, multiplier))

            print(f"  {round_name}: {len(matches)} match(es)")

        # Step 5: Calculate and create rankings
        print("\n--- Calculating rankings ---")
        stats = defaultdict(lambda: {
            'wins': 0, 'losses': 0, 'eggsBroken': 0, 'eggsLost': 0,
            'points': 0, 'weightedPoints': 0,
        })

        for home, h_score, away, a_score, rtype, multiplier in all_matches_data:
            stats[home]['eggsBroken'] += h_score
            stats[home]['eggsLost'] += a_score
            stats[home]['points'] += h_score
            stats[home]['weightedPoints'] += h_score * multiplier

            stats[away]['eggsBroken'] += a_score
            stats[away]['eggsLost'] += h_score
            stats[away]['points'] += a_score
            stats[away]['weightedPoints'] += a_score * multiplier

            if h_score > a_score:
                stats[home]['wins'] += 1
                stats[away]['losses'] += 1
            else:
                stats[away]['wins'] += 1
                stats[home]['losses'] += 1

        # Assign positions
        position_map = {}
        for base_pos, names in POSITION_TIERS.items():
            if len(names) == 1:
                position_map[names[0]] = base_pos
            else:
                sorted_names = sorted(names, key=lambda n: -stats[n]['weightedPoints'])
                for i, name in enumerate(sorted_names):
                    position_map[name] = base_pos + i

        print("\n--- Creating rankings ---")
        for name in COMPETITORS:
            s = stats[name]
            pos = position_map.get(name, 24)
            cur.execute("""
                INSERT INTO rankings ("competitionId", "competitorId", position, points,
                                     "weightedPoints", wins, losses, "eggsBroken", "eggsLost", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (competition_id, comp_ids[name], pos, s['points'], s['weightedPoints'],
                  s['wins'], s['losses'], s['eggsBroken'], s['eggsLost']))

            print(f"  #{pos:2d} {name:25s} W:{s['wins']} L:{s['losses']} "
                  f"EB:{s['eggsBroken']} EL:{s['eggsLost']} WP:{s['weightedPoints']}")

        # Step 6: Update competitor global stats
        print("\n--- Updating competitor global stats ---")
        for name in COMPETITORS:
            s = stats[name]
            cur.execute("""
                UPDATE competitors
                SET "totalWins" = "totalWins" + %s,
                    "totalLosses" = "totalLosses" + %s,
                    "totalEggsBroken" = "totalEggsBroken" + %s,
                    "totalEggsLost" = "totalEggsLost" + %s,
                    "updatedAt" = NOW()
                WHERE id = %s
            """, (s['wins'], s['losses'], s['eggsBroken'], s['eggsLost'], comp_ids[name]))

        conn.commit()
        print("\n=== TRANSACTION COMMITTED SUCCESSFULLY ===")
        print(f"Competition ID: {competition_id}")
        print(f"Competitors: {len(comp_ids)}")
        print(f"Total rounds: {round_number}")
        print(f"Total matches: {len(all_matches_data)}")

    except Exception as e:
        conn.rollback()
        print(f"\n!!! ERROR - ROLLED BACK: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    main()
