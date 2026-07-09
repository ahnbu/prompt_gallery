# Prompt Gallery Design Layout QA

Command: node scripts/qa/browser-design-layout.mjs --output .omo/evidence/final-readonly-review-design-layout.md
Base URL: http://127.0.0.1:5173
Output: .omo/evidence/final-readonly-review-design-layout.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Light design tokens are active on the rendered app shell.
- Desktop prompt row renders no more than 4 non-image cards.
- Prompt, Workflow, and Repo cards are square.
- Image prompt cards use natural-ratio masonry: wide < square < tall.
- Mobile/tablet/desktop viewports have no horizontal overflow.

## Fixture
```json
{
  "suffix": "1783584203994-38f0cd",
  "prompts": [
    "DesignQA Prompt 1 1783584203994-38f0cd",
    "DesignQA Prompt 2 1783584203994-38f0cd",
    "DesignQA Prompt 3 1783584203994-38f0cd",
    "DesignQA Prompt 4 1783584203994-38f0cd"
  ],
  "repos": [
    "DesignQA Repo 1 1783584203994-38f0cd",
    "DesignQA Repo 2 1783584203994-38f0cd"
  ],
  "workflows": [
    "DesignQA Workflow 1 1783584203994-38f0cd",
    "DesignQA Workflow 2 1783584203994-38f0cd"
  ],
  "images": [
    {
      "key": "wide",
      "title": "DesignQA Image Wide 1783584203994-38f0cd",
      "width": 1200,
      "height": 640,
      "id": "481e9df6-6129-431c-b4c9-a4ef57811985"
    },
    {
      "key": "square",
      "title": "DesignQA Image Square 1783584203994-38f0cd",
      "width": 900,
      "height": 900,
      "id": "843623ba-316b-4170-862a-64b427190984"
    },
    {
      "key": "tall",
      "title": "DesignQA Image Tall 1783584203994-38f0cd",
      "width": 640,
      "height": 1240,
      "id": "e5c421a2-8637-48bf-b0e5-b7592363551a"
    }
  ]
}
```

## Color Samples
```json
[
  {
    "viewport": "mobile",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  },
  {
    "viewport": "tablet",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  },
  {
    "viewport": "desktop",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  }
]
```

## Geometry Metrics
```json
[
  {
    "viewport": "mobile",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      }
    }
  },
  {
    "viewport": "tablet",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      }
    }
  },
  {
    "viewport": "desktop",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783584203994-38f0cd": {
        "width": 264,
        "height": 264
      }
    },
    "desktopGrid": {
      "firstRowCount": 4
    },
    "imageMasonry": {
      "wide": 346,
      "square": 453,
      "tall": 644
    }
  }
]
```

## Screenshots
- mobile/all: .omo/evidence/final-readonly-review-design-layout-mobile-all.png (154964 bytes)
- tablet/all: .omo/evidence/final-readonly-review-design-layout-tablet-all.png (127047 bytes)
- desktop/all: .omo/evidence/final-readonly-review-design-layout-desktop-all.png (110941 bytes)

## Dev Server Logs
- stdout: .omo/evidence/final-readonly-review-design-layout-dev.stdout.log
- stderr: .omo/evidence/final-readonly-review-design-layout-dev.stderr.log

