---
title: Chinese Report Polishing
summary: De-AI Chinese academic writing skill and multi-agent review workflow tailored for STEM lab reports.
role: Agent workflows and technical writing
tags: [Python, Agent Skill, NLP, Technical Writing]
cover: /media/report-polishing-architecture.png
repo: https://github.com/Kang-Zhaoyuan/Chinese-Report-Polishing
---
## Overview
An agent skill and workflow designed specifically for Chinese STEM undergraduate lab reports, aiming to eliminate generic "AI-flavored" filler words and restore concise, rigorous, and fact-oriented technical writing.

## Architecture & Mechanisms
- **Three-tier role isolation**: An Orchestrator executes static scan scripts and coordinates workflow; a persistent Writer-Refiner maintains context across iterations; and four disposable Specialist Reviewers perform targeted audits.
- **Four staged review pipelines**: Progresses through macro-structure, redundancy elimination, paragraph logic, and syntax/lexical scrutiny based on a 14-category error taxonomy.
- **Document parsing and scanner integration**: Automated Word document parsing, table recursion, text mirror extraction, and modular Python scanning scripts.
- **Human-in-the-loop arbitration**: Flags persistent disagreements for human adjudication to ensure factual integrity.

The diagram above illustrates the multi-agent role isolation and staged review architecture.
