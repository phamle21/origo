<?php

namespace App\Support;

use RuntimeException;

/** Thrown when an install is attempted after an administrator already exists. */
class AlreadyInstalledException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Origo is already installed.');
    }
}
