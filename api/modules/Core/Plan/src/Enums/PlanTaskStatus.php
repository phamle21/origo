<?php

namespace Origo\Core\Plan\Enums;

enum PlanTaskStatus: string
{
    case Todo = 'todo';
    case Doing = 'doing';
    case Done = 'done';
}
